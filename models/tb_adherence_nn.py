import torch
import torch.nn as nn
from torch.utils.data import Dataset
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler, LabelEncoder

class TBAdherenceDataset(Dataset):
    def __init__(self, dataframe, target_col='OUTCOME_POOR', mode='train'):
        """
        Args:
            dataframe (pd.DataFrame): Input dataframe
            target_col (str): Column name for the target variable
            mode (str): 'train' or 'inference' (inference doesn't require target)
        """
        self.mode = mode
        self.df = dataframe.copy()
        self.target_col = target_col
        
        # Define features (based on Jali.sql structure)
        # Exclude ID columns and Target columns from features
        self.feature_cols = [
            'PROVINCE', 'COUNTYID', 'ARM', 'STRATA', 'GENDER', 
            'AGECAT_CALC', 'OCCUPATION_CALC', 'EDUCATIONLEVEL', 
            'MARRIED_CALC', 'RESIDENCE', 'INCOMCAT_CALC', 
            'DISTTBCL_CALC', 'DISTSUPERV_CALC', 'MEDINSUR_CALC', 'SMEARTEST'
        ]
        
        # Simple preprocessing (Handle NaNs)
        self.df[self.feature_cols] = self.df[self.feature_cols].fillna(0)
        
        # Extract features
        self.X = self.df[self.feature_cols].values.astype(np.float32)
        
        # Scale features (StandardScaler)
        # In a real pipeline, we should fit scalar on train and transform test/inference
        # For now, simplistic local scaling (Should be improved)
        self.scaler = StandardScaler()
        self.X = self.scaler.fit_transform(self.X)

        if self.mode == 'train':
            # Extract target
            if self.target_col in self.df.columns:
                self.y = self.df[self.target_col].values.astype(np.float32).reshape(-1, 1)
            else:
                raise ValueError(f"Target column {self.target_col} not found in dataframe")
        
    def __len__(self):
        return len(self.df)
    
    def __getitem__(self, idx):
        if self.mode == 'train':
            return self.X[idx], self.y[idx]
        else:
            return self.X[idx]

class TBAdherenceNN(nn.Module):
    def __init__(self, input_dim):
        super(TBAdherenceNN, self).__init__()
        
        # Feed Forward Neural Network
        self.layer1 = nn.Linear(input_dim, 64)
        self.relu1 = nn.ReLU()
        self.dropout1 = nn.Dropout(0.3)
        
        self.layer2 = nn.Linear(64, 32)
        self.relu2 = nn.ReLU()
        self.dropout2 = nn.Dropout(0.2)
        
        self.layer3 = nn.Linear(32, 1)
        self.sigmoid = nn.Sigmoid()
        
    def forward(self, x):
        x = self.layer1(x)
        x = self.relu1(x)
        x = self.dropout1(x)
        
        x = self.layer2(x)
        x = self.relu2(x)
        x = self.dropout2(x)
        
        x = self.layer3(x)
        x = self.sigmoid(x)
        return x
