import pandas as pd
from .base_model import JaliBaseModel
from xgboost import XGBClassifier

class HIVQocModel(JaliBaseModel):
    def __init__(self):
        super().__init__("HIV Quality of Care Model")

    def get_feature_columns(self):
        return [
            'FacilityType', 'Age', 'Sex', 'MaritalStatus', 'EducationLevel'
        ]

    def get_target_column(self):
        return 'TARGET_VIRALLY_SUPPRESSED'

    def get_categorical_columns(self):
        return ['FacilityType', 'Sex', 'MaritalStatus', 'EducationLevel']

    def train(self, df):
        # Case-insensitive check for ViralLoad
        actual_cols = {c.upper(): c for c in df.columns}
        vload_col = actual_cols.get('VIRALLOAD')
        target_col = self.get_target_column()
        
        if vload_col and target_col not in df.columns:
            print(f"   Engineering target: {target_col} from {vload_col} column.")
            df[target_col] = df[vload_col].apply(
                lambda x: 1 if str(x).lower() == 'suppressed' or (str(x).isdigit() and int(x) < 200) else 0
            )
        return super().train(df)

    def build_estimator(self):
        return XGBClassifier(
            n_estimators=150,
            learning_rate=0.1,
            max_depth=6,
            scale_pos_weight=2, # Adjust if suppression is unbalanced
            random_state=42
        )
