from dataclasses import dataclass
from typing import ClassVar

import cv2
import numpy as np


@dataclass(frozen=True)
class NucleusFeatures:
    gray_mean: float
    gray_std: float
    red_mean: float
    green_mean: float
    blue_mean: float
    area: float
    perimeter: float
    circularity: float

    def as_ordered_vector(self) -> tuple[float, ...]:
        return (
            self.gray_mean,
            self.gray_std,
            self.red_mean,
            self.green_mean,
            self.blue_mean,
            self.area,
            self.perimeter,
            self.circularity,
        )


@dataclass(frozen=True)
class NucleusCandidate:
    candidate_id: int
    bbox: tuple[int, int, int, int]
    mask: np.ndarray
    features: NucleusFeatures


class NucleusService:
    MIN_AREA: ClassVar[int] = 15
    MAX_AREA: ClassVar[int] = 5000

    @staticmethod
    def _validate_rgb_image(rgb_image: np.ndarray) -> None:
        if (
            not isinstance(rgb_image, np.ndarray)
            or rgb_image.ndim != 3
            or rgb_image.shape[2] != 3
            or rgb_image.dtype != np.uint8
        ):
            raise ValueError("Expected an RGB image with shape (height, width, 3) and dtype uint8.")

    @classmethod
    def features_from_mask(
        cls, rgb_image: np.ndarray, mask: np.ndarray
    ) -> NucleusFeatures:
        """Calculate the model's eight features for one binary nucleus mask."""
        cls._validate_rgb_image(rgb_image)
        if not isinstance(mask, np.ndarray) or mask.ndim != 2 or mask.shape != rgb_image.shape[:2]:
            raise ValueError("Mask must be a 2D array matching the RGB image dimensions.")

        gray_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
        return cls._features_from_validated_mask(rgb_image, gray_image, mask)

    @staticmethod
    def _features_from_validated_mask(
        rgb_image: np.ndarray, gray_image: np.ndarray, mask: np.ndarray
    ) -> NucleusFeatures:
        foreground = mask != 0
        area = int(np.count_nonzero(foreground))
        if area == 0:
            raise ValueError("Nucleus mask must contain at least one foreground pixel.")

        pixels = rgb_image[foreground].astype(np.float64)
        gray_pixels = gray_image[foreground].astype(np.float64)
        binary_mask = foreground.astype(np.uint8)
        contours, _ = cv2.findContours(
            binary_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE
        )
        perimeter = float(sum(cv2.arcLength(contour, True) for contour in contours))
        circularity = (4.0 * np.pi * area / (perimeter * perimeter)) if perimeter else 0.0

        return NucleusFeatures(
            gray_mean=float(np.mean(gray_pixels)),
            gray_std=float(np.std(gray_pixels)),
            red_mean=float(np.mean(pixels[:, 0])),
            green_mean=float(np.mean(pixels[:, 1])),
            blue_mean=float(np.mean(pixels[:, 2])),
            area=float(area),
            perimeter=perimeter,
            circularity=float(circularity),
        )

    @classmethod
    def extract_candidates(
        cls,
        rgb_image: np.ndarray,
        min_area: int = MIN_AREA,
        max_area: int = MAX_AREA,
    ) -> list[NucleusCandidate]:
        """Return experimental image-derived candidates; this is not instance segmentation."""
        cls._validate_rgb_image(rgb_image)
        if min_area < 1 or max_area < min_area:
            raise ValueError("Area limits must satisfy 1 <= min_area <= max_area.")

        normalized_rgb = (rgb_image.astype(np.float32) + 1.0) / 256.0
        optical_density = -np.log10(normalized_rgb)
        hematoxylin_approx = (
            optical_density[:, :, 1] * 0.7 + optical_density[:, :, 0] * 0.3
        )
        stain_image = cv2.normalize(
            hematoxylin_approx, None, 0, 255, cv2.NORM_MINMAX
        ).astype(np.uint8)
        _, foreground = cv2.threshold(
            stain_image, 0, 255, cv2.THRESH_BINARY | cv2.THRESH_OTSU
        )
        component_count, labels, stats, _ = cv2.connectedComponentsWithStats(
            foreground, connectivity=8
        )
        gray_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)

        candidates = []
        for component_id in range(1, component_count):
            area = int(stats[component_id, cv2.CC_STAT_AREA])
            if not min_area <= area <= max_area:
                continue

            x = int(stats[component_id, cv2.CC_STAT_LEFT])
            y = int(stats[component_id, cv2.CC_STAT_TOP])
            width = int(stats[component_id, cv2.CC_STAT_WIDTH])
            height = int(stats[component_id, cv2.CC_STAT_HEIGHT])
            mask = labels[y : y + height, x : x + width] == component_id
            candidates.append(
                NucleusCandidate(
                    candidate_id=len(candidates) + 1,
                    bbox=(x, y, width, height),
                    mask=mask,
                    features=cls._features_from_validated_mask(
                        rgb_image[y : y + height, x : x + width],
                        gray_image[y : y + height, x : x + width],
                        mask,
                    ),
                )
            )
        return candidates

    @classmethod
    def extract_annotated_instance_features(
        cls,
        rgb_image: np.ndarray,
        instance_map: np.ndarray,
        min_area: int = MIN_AREA,
        max_area: int = MAX_AREA,
    ) -> dict[int, NucleusFeatures]:
        """Extract features from ground-truth instance IDs for validation only."""
        cls._validate_rgb_image(rgb_image)
        if (
            not isinstance(instance_map, np.ndarray)
            or instance_map.ndim != 2
            or instance_map.shape != rgb_image.shape[:2]
            or not np.issubdtype(instance_map.dtype, np.integer)
            or np.any(instance_map < 0)
        ):
            raise ValueError("Instance map must be a matching 2D non-negative integer array.")
        if min_area < 1 or max_area < min_area:
            raise ValueError("Area limits must satisfy 1 <= min_area <= max_area.")

        features_by_instance = {}
        gray_image = cv2.cvtColor(rgb_image, cv2.COLOR_RGB2GRAY)
        for instance_id in np.unique(instance_map):
            if instance_id == 0:
                continue
            mask = instance_map == instance_id
            area = int(np.count_nonzero(mask))
            if min_area <= area <= max_area:
                features_by_instance[int(instance_id)] = cls._features_from_validated_mask(
                    rgb_image, gray_image, mask
                )
        return features_by_instance
