from .base_model import JaliBaseModel
from xgboost import XGBClassifier

class MenstrualTrackingModel(JaliBaseModel):
    def __init__(self):
        super().__init__("Menstrual Tracking Model")

    def get_feature_columns(self):
        return [
            'LengthofCycle', 'Age', 'BMI', 'MeanCycleLength'
        ]

    def get_target_column(self):
        return 'CycleWithPeakorNot'

    def get_categorical_columns(self):
        return []

    def build_estimator(self):
        return XGBClassifier(
            n_estimators=100,
            learning_rate=0.05,
            max_depth=4,
            random_state=42
        )
