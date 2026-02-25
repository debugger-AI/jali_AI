from .base_model import JaliBaseModel
from xgboost import XGBClassifier

class TBAdherenceModel(JaliBaseModel):
    def __init__(self):
        super().__init__("TB Adherence Model")

    def get_feature_columns(self):
        return [
            'gender', 'agecat_calc', 'occupation_calc', 
            'distTBcl_calc', 'strata', 'arm', 'smeartest'
        ]

    def get_target_column(self):
        return 'outcome_poor'

    def get_categorical_columns(self):
        return ['gender', 'occupation_calc', 'strata', 'arm', 'smeartest']

    def build_estimator(self):
        return XGBClassifier(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=5,
            use_label_encoder=False,
            eval_metric='logloss',
            random_state=42
        )
