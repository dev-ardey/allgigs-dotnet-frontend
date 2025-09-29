import React from 'react';

// Interface aligned with the Job type in pages/index.tsx
interface Job {
  UNIQUE_ID: string;
  Title: string;
  Company: string;
  Location: string; // Made required to match index.tsx
  rate: string;
  date: string;
  Summary: string;
  URL: string;
  created_at?: string;
  inserted_at?: string;
  added_by?: string;
  added_by_email?: string;
  poster_name?: string;
  source?: string;
  tags?: string;
  clicked_at?: string;
}

interface RecentlyClickedJobsProps {
  jobs: Job[];
  isLoading: boolean;
  onJobClick: (job: Job) => void;
  isJobNew: (job: Job) => boolean;
}

const formatDateViewed = (clickedAtISO?: string): string => {
  if (!clickedAtISO) return '';
  const date = new Date(clickedAtISO);
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

const RecentlyClickedJobs: React.FC<RecentlyClickedJobsProps> = ({ jobs, isLoading, onJobClick, isJobNew }) => {
  if (isLoading) {
    return <div className="recently-clicked-loading">Loading manage jobs...</div>;
  }

  if (jobs.length === 0) {
    return <div className="recently-clicked-no-jobs">No jobs clicked yet.</div>;
  }

  return (
    <div className="recently-clicked-container">
      <h3 className="recently-clicked-header">Manage Jobs</h3>
      <div className="recently-clicked-job-row-container">
        {jobs.map((job) => {
          const viewedDateText = formatDateViewed(job.clicked_at);

          return (
            <div key={job.UNIQUE_ID} className={`recently-clicked-job-row ${isJobNew(job) ? 'recently-clicked-new-job' : ''}`} onClick={() => onJobClick(job)}>
              <div className="recently-clicked-job-info">
                <h4 className="recently-clicked-job-title">{job.Title}</h4>
                <p className="recently-clicked-company">{job.Company}</p>
              </div>
              <div className="recently-clicked-job-meta">
                {job.Location && <p className="recently-clicked-location">{job.Location}</p>}
                <p className="recently-clicked-viewed-date">Viewed: {viewedDateText}</p>
                <a href={job.URL} target="_blank" rel="noopener noreferrer" className="recently-clicked-job-link" onClick={(e) => e.stopPropagation()}>
                  View
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecentlyClickedJobs;
