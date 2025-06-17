import React from 'react';
import styles from './recentlyClickedJobs.module.css';

// Interface aligned with the Job type in pages/jobs.tsx
interface Job {
  UNIQUE_ID: string;
  Title: string; // Was JOB_TITLE
  Company: string; // Was COMPANY
  URL: string; // Was JOB_URL
  date: string; // Was DATE_ADDED, used for displaying date
  created_at?: string; // For isJobNew compatibility
  inserted_at?: string; // For isJobNew compatibility
  Location?: string;
  Summary?: string;
  rate?: string;
  clicked_at?: string; // Added to store when the job was clicked
  // Add any other job properties you expect to display from jobs.tsx Job type
}

interface RecentlyClickedJobsProps {
  jobs: Job[];
  isLoading: boolean;
  onJobClick: (job: Job) => void; // Expects a Job object
  isJobNew: (job: Job) => boolean;   // Expects a Job object
}

const formatDateViewed = (clickedAtISO?: string): string => {
  if (!clickedAtISO) return '';
  const date = new Date(clickedAtISO);
  return date.toLocaleDateString('en-CA'); // YYYY-MM-DD format
};

const RecentlyClickedJobs: React.FC<RecentlyClickedJobsProps> = ({ jobs, isLoading, onJobClick, isJobNew }) => {
  if (isLoading) {
    return <div className={styles.loading}>Loading manage jobs...</div>;
  }

  if (jobs.length === 0) {
    return <div className={styles.noJobs}>No jobs clicked yet.</div>;
  }

  return (
    <div className={styles.recentlyClickedContainer}>
      <h3 className={styles.header}>Manage Jobs</h3>
      <div className={styles.jobRowContainer}>
        {jobs.map((job) => {
          const viewedDateText = formatDateViewed(job.clicked_at);

          return (
            <div key={job.UNIQUE_ID} className={`${styles.jobRow} ${isJobNew(job) ? styles.newJob : ''}`} onClick={() => onJobClick(job)}>
              <div className={styles.jobInfo}>
                <h4 className={styles.jobTitle}>{job.Title}</h4>
                <p className={styles.company}>{job.Company}</p>
              </div>
              <div className={styles.jobMeta}>
                {job.Location && <p className={styles.location}>{job.Location}</p>}
                <p className={styles.viewedDate}>Viewed: {viewedDateText}</p>
                <a href={job.URL} target="_blank" rel="noopener noreferrer" className={styles.jobLink} onClick={(e) => e.stopPropagation()}>
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