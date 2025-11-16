import React, { useState } from 'react';
import { Job } from '../../types/types';
import JobCard from './JobCard';

interface JobStackProps {
  jobs: Job[];
}

const JobStack: React.FC<JobStackProps> = ({ jobs }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  if (!jobs || jobs.length === 0) {
    return null;
  }

  const primaryJob = jobs[0];
  const jobCount = jobs.length;

  if (!primaryJob) {
    return null;
  }

  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1rem', overflow: 'hidden' }}>
      {/* Collapsed View / Always Visible Header */}
      <div onClick={handleToggle} style={{ padding: '1rem', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb' }}>
        <div>
          <h3 style={{ margin: 0, fontSize: '1.25rem' }} dangerouslySetInnerHTML={{ __html: primaryJob.Title || '' }} />
          <p style={{ margin: '0.25rem 0', color: '#6b7280' }}>
            <span dangerouslySetInnerHTML={{ __html: primaryJob.Company || '' }} /> - {jobs.map(j => j.Location).join(', ')}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', background: '#e5e7eb', padding: '0.5rem 1rem', borderRadius: '16px' }}>
          <span>{jobCount} Jobs</span>
          <span style={{ marginLeft: '0.5rem' }}>{isExpanded ? '▲' : '▼'}</span>
        </div>
      </div>

      {/* Expanded View */}
      {isExpanded && (
        <div style={{ padding: '1rem', borderTop: '1px solid #e5e7eb', background: 'white' }}>
          {jobs.map(job => (
            <JobCard key={job.UNIQUE_ID} job={job} groupSize={1} />
          ))}
        </div>
      )}
    </div>
  );
};

export default JobStack;
