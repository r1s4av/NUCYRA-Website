# NUCYRA — Static Research Evaluation Assets

This folder is the designated drop-zone for approved static reports and visual evaluation artifacts generated during the academic project.

---

## Available Historical Artifacts

The three files below are present and are rendered in AI Insights as archived experiment results, not live analysis output.

1. **`decision_tree_confusion_matrix.png`**
   - The confusion matrix plot generated during test evaluation of the Decision Tree model.
   - Displayed by AI Insights with the true-label and predicted-label axes preserved.

2. **`decision_tree_classification_metrics.csv`**
   - Contains per-class precision, recall, f1-score, support, and aggregate rows.
   - The first CSV header cell is blank; remaining headers are `precision`, `recall`, `f1-score`, and `support`.

3. **`kmeans_cluster_comparison.csv`**
   - Contains a cross-tabulation with reference labels in rows and cluster IDs `0` through `4` in columns.
   - Cluster IDs are unsupervised assignments and are not verified biological classes.

4. **`ivp_demonstrations.png`**
   - Not present; the AI Insights page does not show a placeholder microscopy image.

---

## Empty State Behavior

If a report asset is missing or cannot be loaded:
- The NUCYRA frontend will display a clean, informative placeholder card specifying the exact file name and path.
- The interface will cite only the verified historical benchmarks (~49.83% accuracy, ARI ~0.055, NMI ~0.073) without inventing false data or broken image links.
