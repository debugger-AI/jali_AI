from .base_model import JaliBaseModel
from xgboost import XGBClassifier

class HIVAdherenceModel(JaliBaseModel):
    def __init__(self):
        super().__init__("HIV Adherence Model")

    def get_feature_columns(self):
        return [
            'Age_years', 'Gender', 'Sex_at_birth', 'Years_of_Education'
        ]

    def get_target_column(self):
        return 'Taking_Meds'

    def get_categorical_columns(self):
        return ['Gender', 'Sex_at_birth', 'Years_of_Education']

    def train(self, df):
        # Case-insensitive check for Taking_Meds
        actual_cols = {c.upper(): c for c in df.columns}
        target_name = self.get_target_column()
        actual_target_col = actual_cols.get(target_name.upper())

        if actual_target_col:
            # Convert target to numeric
            if df[actual_target_col].dtype == object:
                print(f"   Encoding {actual_target_col} to binary...")
                df[actual_target_col] = df[actual_target_col].map({'Yes': 1, 'No': 0}).fillna(0)
        
        return super().train(df)

    def build_estimator(self):
        return XGBClassifier(
            n_estimators=50,
            learning_rate=0.01,
            max_depth=3,
            random_state=42
        )
