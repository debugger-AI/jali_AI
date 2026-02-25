import pandas as pd
from datetime import datetime, timedelta

class ImmunizationTracker:
    def __init__(self, schedule_df):
        """
        schedule_df: DataFrame with ['Age', 'Vaccine_Name', 'Dose']
        """
        # Normalize column names to uppercase for internal mapping
        schedule_df.columns = [c.upper() for c in schedule_df.columns]
        self.schedule = schedule_df
        
        self.age_mapping = {
            'Birth': 0,
            '6 Weeks': 42,
            '10 Weeks': 70,
            '14 Weeks': 98,
            '6 Months': 182,
            '7 Months': 212,
            '9 Months': 273,
            '12 Months': 365,
            '18 Months': 547,
            '2 Years': 730
        }
        self.schedule['due_days'] = self.schedule['AGE'].map(self.age_mapping)

    def get_schedule_status(self, child_dob, current_status):
        """
        child_dob: datetime object
        current_status: string (e.g. 'Fully Immunized', 'Partial', or last vaccine name)
        Returns: Dict with next due vaccine and days remaining
        """
        dob = pd.to_datetime(child_dob)
        today = datetime.now()
        age_days = (today - dob).days
        
        # Filter vaccines that should have been taken by now
        due_now = self.schedule[self.schedule['due_days'] <= age_days].copy()
        
        # Filter upcoming vaccines
        upcoming = self.schedule[self.schedule['due_days'] > age_days].sort_values('due_days')
        
        next_vaccine = None
        if not upcoming.empty:
            row = upcoming.iloc[0]
            due_date = dob + timedelta(days=int(row['due_days']))
            next_vaccine = {
                'vaccine': row['VACCINE_NAME'],
                'due_date': due_date.strftime('%Y-%m-%d'),
                'days_remaining': (due_date - today).days
            }
            
        return {
            'age_days': age_days,
            'next_due': next_vaccine,
            'status_flag': 'Action Needed' if 'Partial' in str(current_status) else 'On Track'
        }

    def batch_process_ovc(self, ovc_df):
        """
        Processes a list of OVCs and predicts who is likely to miss their next appointment.
        """
        # Case insensitive mapping
        actual_cols = {c.upper(): c for c in ovc_df.columns}
        col_id = actual_cols.get('OVC_ID', 'ovc_id')
        col_name = actual_cols.get('OVC_NAME', 'ovc_name')
        col_dob = actual_cols.get('DOB', 'dob')
        col_status = actual_cols.get('IMMUNIZATION_STATUS', 'immunization_status')

        results = []
        for _, row in ovc_df.iterrows():
            if pd.isna(row[col_dob]): continue
            status = self.get_schedule_status(row[col_dob], row.get(col_status, 'Unknown'))
            results.append({
                'ovc_id': row[col_id],
                'ovc_name': row.get(col_name, 'Unknown'),
                'age_days': status['age_days'],
                'next_vaccine': status['next_due']['vaccine'] if status['next_due'] else 'Complete',
                'due_date': status['next_due']['due_date'] if status['next_due'] else 'N/A'
            })
        return pd.DataFrame(results)
