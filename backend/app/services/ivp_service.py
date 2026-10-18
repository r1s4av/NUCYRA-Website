import io
import time
import base64
import numpy as np
import cv2
from PIL import Image
from typing import Optional, Tuple
from app.config import settings
from app.schemas.ivp_schemas import ImageMetrics, IvpStepConfig

class IvpService:
    @staticmethod
    def validate_and_decode(image_bytes: bytes) -> np.ndarray:
        """
        Validates payload size, decodes image stream in RAM, checks dimensions.
        Never persists bytes to disk.
        """
        if len(image_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
            raise ValueError(f"Payload exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)} MB.")
        
        try:
            # Check format with PIL without disk persistence
            with Image.open(io.BytesIO(image_bytes)) as pil_img:
                pil_format = pil_img.format
                if pil_format not in {"PNG", "JPEG", "TIFF", "BMP"}:
                    raise ValueError(f"Unsupported image format: '{pil_format}'. Supported formats: PNG, JPEG, TIFF, BMP.")
                
                width, height = pil_img.size
                if width > settings.MAX_IMAGE_DIMENSION or height > settings.MAX_IMAGE_DIMENSION:
                    raise ValueError(
                        f"Image dimensions ({width}x{height}) exceed maximum allowed limit of "
                        f"{settings.MAX_IMAGE_DIMENSION}x{settings.MAX_IMAGE_DIMENSION} pixels."
                    )
                
                # Convert PIL to RGB numpy array, then to BGR for OpenCV
                rgb_arr = np.array(pil_img.convert("RGB"))
                bgr_arr = cv2.cvtColor(rgb_arr, cv2.COLOR_RGB2BGR)
                return bgr_arr
        except Exception as e:
            if isinstance(e, ValueError):
                raise
            raise ValueError(f"Corrupted or invalid image data: {str(e)}")

    @staticmethod
    def encode_to_base64(img_np: np.ndarray, format: str = "png") -> str:
        """Encodes an in-memory numpy image array to base64 string."""
        ext = f".{format.lower()}"
        success, buffer = cv2.imencode(ext, img_np)
        if not success:
            raise RuntimeError("Failed to encode image buffer to requested format.")
        return base64.b64encode(buffer).decode("utf-8")

    @staticmethod
    def calculate_metrics(
        img_np: np.ndarray, 
        reference_np: Optional[np.ndarray] = None, 
        execution_time_ms: float = 0.0
    ) -> ImageMetrics:
        """
        Calculates mathematically defined metrics:
        - Mean intensity, RMS contrast (standard deviation)
        - Michelson contrast: (I_max - I_min) / (I_max + I_min)
        - Shannon entropy: H = -sum(p * log2(p + eps))
        - PSNR (if reference image is provided and shapes match)
        - Candidate nuclei count via connected components (if binarized)
        """
        if len(img_np.shape) == 3:
            h, w, c = img_np.shape
            gray = cv2.cvtColor(img_np, cv2.COLOR_BGR2GRAY)
            # Channel histograms for R, G, B
            b_hist = cv2.calcHist([img_np], [0], None, [256], [0, 256]).flatten().astype(int).tolist()
            g_hist = cv2.calcHist([img_np], [1], None, [256], [0, 256]).flatten().astype(int).tolist()
            r_hist = cv2.calcHist([img_np], [2], None, [256], [0, 256]).flatten().astype(int).tolist()
            rgb_hists = {"r": r_hist, "g": g_hist, "b": b_hist}
        else:
            h, w = img_np.shape
            c = 1
            gray = img_np
            rgb_hists = None

        # 1. Mean and RMS contrast
        mean_val = float(np.mean(gray))
        std_val = float(np.std(gray))

        # 2. Michelson Contrast
        i_min = float(np.min(gray))
        i_max = float(np.max(gray))
        denom = i_max + i_min
        michelson = float((i_max - i_min) / denom) if denom > 0 else 0.0

        # 3. Shannon Entropy
        hist = cv2.calcHist([gray], [0], None, [256], [0, 256]).flatten()
        prob = hist / (hist.sum() + 1e-12)
        # Avoid log(0) with small epsilon
        entropy = float(-np.sum(prob * np.log2(prob + 1e-12)))

        # 4. Check if binary mask (only 0 and 255 or 0 and 1)
        unique_vals = np.unique(gray)
        is_binary = len(unique_vals) <= 2 and (set(unique_vals).issubset({0, 255}) or set(unique_vals).issubset({0, 1}))

        foreground_ratio = None
        candidate_nuclei_count = None

        if is_binary:
            binary_mask = (gray > 0).astype(np.uint8) * 255
            foreground_ratio = float(np.count_nonzero(binary_mask) / (h * w))
            # 8-connected components with morphological area filter for nuclei (15 to 5000 px^2)
            num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(binary_mask, connectivity=8)
            # stats[:, cv2.CC_STAT_AREA] -> index 0 is background
            areas = stats[1:, cv2.CC_STAT_AREA]
            valid_nuclei = np.logical_and(areas >= 15, areas <= 5000)
            candidate_nuclei_count = int(np.sum(valid_nuclei))

        # 5. PSNR against reference if provided
        psnr_val = None
        if reference_np is not None:
            # Ensure dimensions match
            ref_gray = cv2.cvtColor(reference_np, cv2.COLOR_BGR2GRAY) if len(reference_np.shape) == 3 else reference_np
            if gray.shape == ref_gray.shape:
                mse = float(np.mean((gray.astype(np.float64) - ref_gray.astype(np.float64)) ** 2))
                if mse < 1e-10:
                    psnr_val = 100.0  # Identical images
                else:
                    psnr_val = float(10.0 * np.log10((255.0 ** 2) / mse))

        return ImageMetrics(
            width=w,
            height=h,
            channels=c,
            mean_intensity=round(mean_val, 2),
            std_intensity=round(std_val, 2),
            michelson_contrast=round(michelson, 4),
            shannon_entropy=round(entropy, 4),
            histogram=hist.astype(int).tolist(),
            rgb_histograms=rgb_hists,
            foreground_ratio=round(foreground_ratio, 4) if foreground_ratio is not None else None,
            candidate_nuclei_count=candidate_nuclei_count,
            psnr_db=round(psnr_val, 2) if psnr_val is not None else None,
            execution_time_ms=round(execution_time_ms, 2)
        )

    @classmethod
    def apply_operation(cls, img_bgr: np.ndarray, config: IvpStepConfig) -> Tuple[np.ndarray, str]:
        """
        Executes a specific real image-processing operation on the input array.
        Returns the processed numpy array and an educational scientific note.
        """
        op = config.operation
        
        if op == "grayscale":
            if config.gray_mode == "luminance":
                out = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
                note = "Standard ITU-R BT.601 luminance conversion (Y = 0.299R + 0.587G + 0.114B)."
            elif config.gray_mode == "mean":
                out = np.mean(img_bgr, axis=2).astype(np.uint8)
                note = "Unweighted arithmetic average of RGB color channels."
            elif config.gray_mode == "hematoxylin_approx":
                # Hematoxylin stain absorbs strongly in yellow-red (absorbance ~ green/red), staining nuclei dark violet
                # Approximate optical density in green/red channels
                norm = (img_bgr.astype(np.float32) + 1.0) / 256.0
                od = -np.log10(norm)
                # Hematoxylin relative optical density weighting
                h_component = od[:, :, 1] * 0.7 + od[:, :, 2] * 0.3  # G + R absorption
                h_norm = cv2.normalize(h_component, None, 0, 255, cv2.NORM_MINMAX)
                out = h_norm.astype(np.uint8)
                note = "Approximated optical density component highlighting Hematoxylin nuclear staining."
            else:
                out = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY)
                note = "Grayscale conversion applied."
            return out, note

        elif op == "clahe":
            clip = max(0.5, min(20.0, config.clahe_clip_limit))
            grid = max(2, min(32, config.clahe_tile_grid))
            clahe = cv2.createCLAHE(clipLimit=clip, tileGridSize=(grid, grid))
            
            if len(img_bgr.shape) == 3:
                # Apply CLAHE to L-channel in LAB color space to preserve color balance
                lab = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2LAB)
                lab[:, :, 0] = clahe.apply(lab[:, :, 0])
                out = cv2.cvtColor(lab, cv2.COLOR_LAB2BGR)
            else:
                out = clahe.apply(img_bgr)
            note = f"Contrast Limited Adaptive Histogram Equalization (Clip Limit: {clip}, Tile Grid: {grid}x{grid}). Prevents over-amplification of noise."
            return out, note

        elif op == "equalize_hist":
            if len(img_bgr.shape) == 3:
                ycrcb = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2YCrCb)
                ycrcb[:, :, 0] = cv2.equalizeHist(ycrcb[:, :, 0])
                out = cv2.cvtColor(ycrcb, cv2.COLOR_YCrCb2BGR)
            else:
                out = cv2.equalizeHist(img_bgr)
            note = "Global Histogram Equalization stretching intensity dynamic range across the full [0, 255] spectrum."
            return out, note

        elif op == "gaussian_blur":
            k = config.gaussian_kernel if config.gaussian_kernel % 2 == 1 else config.gaussian_kernel + 1
            k = max(1, min(31, k))
            sigma = max(0.1, min(10.0, config.gaussian_sigma))
            out = cv2.GaussianBlur(img_bgr, (k, k), sigma)
            note = f"Gaussian Smoothing Filter with {k}x{k} kernel (sigma = {sigma}) for high-frequency noise attenuation."
            return out, note

        elif op == "median_blur":
            k = config.median_kernel if config.median_kernel % 2 == 1 else config.median_kernel + 1
            k = max(3, min(31, k))
            out = cv2.medianBlur(img_bgr, k)
            note = f"Non-linear Median Filter with {k}x{k} kernel, preserving nuclear edge boundaries while removing impulse noise."
            return out, note

        elif op == "bilateral_filter":
            d = max(1, min(25, config.bilateral_d))
            sc = config.bilateral_sigma_color
            ss = config.bilateral_sigma_space
            out = cv2.bilateralFilter(img_bgr, d, sc, ss)
            note = f"Bilateral edge-preserving filter (d={d}, sigmaColor={sc}, sigmaSpace={ss}). Smooths texture while maintaining chromatic borders."
            return out, note

        elif op == "otsu_threshold":
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
            thresh_flag = cv2.THRESH_BINARY_INV if config.threshold_invert else cv2.THRESH_BINARY
            thresh_val, out = cv2.threshold(gray, 0, 255, thresh_flag + cv2.THRESH_OTSU)
            note = f"Otsu's global binarization (optimal calculated threshold: {thresh_val:.1f}). Minimizes intra-class intensity variance."
            return out, note

        elif op == "adaptive_threshold":
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
            bs = config.adaptive_block_size if config.adaptive_block_size % 2 == 1 else config.adaptive_block_size + 1
            bs = max(3, min(99, bs))
            c_val = config.adaptive_c
            method = cv2.ADAPTIVE_THRESH_GAUSSIAN_C if config.adaptive_method == "gaussian" else cv2.ADAPTIVE_THRESH_MEAN_C
            thresh_type = cv2.THRESH_BINARY_INV if config.threshold_invert else cv2.THRESH_BINARY
            out = cv2.adaptiveThreshold(gray, 255, method, thresh_type, bs, c_val)
            note = f"Local Adaptive Thresholding ({config.adaptive_method.capitalize()}, neighborhood={bs}x{bs}, C={c_val}). Adjusts threshold for uneven illumination."
            return out, note

        elif op == "morphology":
            shape_map = {
                "ellipse": cv2.MORPH_ELLIPSE,
                "rect": cv2.MORPH_RECT,
                "cross": cv2.MORPH_CROSS
            }
            op_map = {
                "opening": cv2.MORPH_OPEN,
                "closing": cv2.MORPH_CLOSE,
                "erosion": cv2.MORPH_ERODE,
                "dilation": cv2.MORPH_DILATE,
                "gradient": cv2.MORPH_GRADIENT,
                "tophat": cv2.MORPH_TOPHAT
            }
            kshape = shape_map.get(config.morph_kernel_shape, cv2.MORPH_ELLIPSE)
            ksize = max(1, min(25, config.morph_kernel_size))
            kernel = cv2.getStructuringElement(kshape, (ksize, ksize))
            mop = op_map.get(config.morph_op, cv2.MORPH_OPEN)
            iters = max(1, min(10, config.morph_iterations))
            
            # Ensure binary or grayscale
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
            out = cv2.morphologyEx(gray, mop, kernel, iterations=iters)
            note = f"Mathematical Morphology: {config.morph_op.capitalize()} using {ksize}x{ksize} {config.morph_kernel_shape} kernel ({iters} iterations)."
            return out, note

        elif op == "sobel":
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
            k = config.sobel_ksize if config.sobel_ksize in (1, 3, 5, 7) else 3
            sobelx = cv2.Sobel(gray, cv2.CV_64F, 1, 0, ksize=k)
            sobely = cv2.Sobel(gray, cv2.CV_64F, 0, 1, ksize=k)
            magnitude = cv2.magnitude(sobelx, sobely)
            out = cv2.convertScaleAbs(magnitude)
            note = f"Sobel Spatial Gradient (kernel={k}x{k}). Computes first-order spatial derivative to accentuate nuclear membrane contours."
            return out, note

        elif op == "canny":
            gray = cv2.cvtColor(img_bgr, cv2.COLOR_BGR2GRAY) if len(img_bgr.shape) == 3 else img_bgr
            t1 = max(0.0, min(255.0, config.canny_thresh1))
            t2 = max(0.0, min(255.0, config.canny_thresh2))
            out = cv2.Canny(gray, t1, t2)
            note = f"Canny Multi-Stage Edge Detector (low={t1}, high={t2}). Employs non-maximum suppression and hysteresis thresholding."
            return out, note

        raise ValueError(f"Unrecognized operation: '{op}'")
