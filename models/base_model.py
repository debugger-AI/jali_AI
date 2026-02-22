import os
import joblib
import pandas as pd
import numpy as np
from abc import ABC, abstractmethod
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.metrics import classification_report, confusion_matrix, roc_auc_score

class JaliBaseModel(ABC):
    def __init__(self, model_name):
        self.model_name = model_name
        self.pipeline = None
        self.feature_cols = self.get_feature_columns()
        self.target_col = self.get_target_column()
        self.categorical_features = self.get_categorical_columns()
        self.numerical_features = [c for c in self.feature_cols if c not in self.categorical_features]

    @abstractmethod
    def get_feature_columns(self):
        """Return list of feature columns."""
        pass

    @abstractmethod
    def get_target_column(self):
        """Return target column name."""
        pass

    @abstractmethod
    def get_categorical_columns(self):
        """Return list of categorical column names."""
        return []

    @abstractmethod
    def build_estimator(self):
        """Return the ML estimator (e.g. XGBClassifier)."""
        pass

    def build_pipeline(self, numerical_features=None, categorical_features=None):
        """Constructs the full scikit-learn pipeline."""
        num_cols = numerical_features if numerical_features is not None else self.numerical_features
        cat_cols = categorical_features if categorical_features is not None else self.categorical_features

        numeric_transformer = Pipeline(steps=[
            ('scaler', StandardScaler())
        ])

        categorical_transformer = Pipeline(steps=[
            ('onehot', OneHotEncoder(handle_unknown='ignore'))
        ])

        preprocessor = ColumnTransformer(
            transformers=[
                ('num', numeric_transformer, num_cols),
                ('cat', categorical_transformer, cat_cols)
            ])

        self.pipeline = Pipeline(steps=[
            ('preprocessor', preprocessor),
            ('classifier', self.build_estimator())
        ])
        return self.pipeline

    def train(self, df):
        """Clean, split, and train the model."""
        print(f"--- Training {self.model_name} ---")
        
        # Case-insensitive column matching
        actual_cols = {c.upper(): c for c in df.columns}
        
        target_col = actual_cols.get(self.target_col.upper())
        if not target_col:
            raise KeyError(f"Target column {self.target_col} not found in dataframe.")
        
        feature_cols = []
        for c in self.feature_cols:
            actual_c = actual_cols.get(c.upper())
            if not actual_c:
                print(f"   Warning: Feature {c} not found in data.")
                continue
            feature_cols.append(actual_c)
            
        categorical_features = [actual_cols.get(c.upper()) for c in self.categorical_features if c.upper() in actual_cols]
        numerical_features = [actual_cols.get(c.upper()) for c in self.numerical_features if c.upper() in actual_cols]

        # Drop rows with missing target
        df = df.dropna(subset=[target_col])
        
        # Pre-cleaning: remove leading/trailing spaces from all columns
        df = df.apply(lambda x: x.str.strip() if x.dtype == "object" else x)

        # Force numerical conversion
        for col in numerical_features:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        # Fill missing features with defaults
        df[numerical_features] = df[numerical_features].fillna(0)
        df[categorical_features] = df[categorical_features].fillna('Unknown')

        X = df[feature_cols]
        y = df[target_col]

        # Final check: Convert target to numeric
        if y.dtype == object:
            y = pd.to_numeric(y, errors='coerce').fillna(0)

        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42, stratify=y if len(np.unique(y)) > 1 else None
        )

        self.build_pipeline(numerical_features=numerical_features, categorical_features=categorical_features)
        self.pipeline.fit(X_train, y_train)

        # Evaluation
        y_pred = self.pipeline.predict(X_test)
        y_prob = self.pipeline.predict_proba(X_test)[:, 1]

        print("\nClassification Report:")
        print(classification_report(y_test, y_pred))
        
        auc = roc_auc_score(y_test, y_prob)
        print(f"AUC-ROC Score: {auc:.4f}")

        return {
            'auc': auc,
            'report': classification_report(y_test, y_pred, output_dict=True)
        }

    def save(self):
        """Save model to artifacts folder."""
        artifact_dir = os.path.join(os.path.dirname(__file__), 'artifacts')
        os.makedirs(artifact_dir, exist_ok=True)
        path = os.path.join(artifact_dir, f"{self.model_name.lower().replace(' ', '_')}.joblib")
        joblib.dump(self.pipeline, path)
        print(f"Model saved to {path}")
        return path

    def load(self, path):
        """Load model from path."""
        self.pipeline = joblib.load(path)
        print(f"Model loaded from {path}")
        return self.pipeline
