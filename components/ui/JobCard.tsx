import React from 'react';
import { Job } from '../../types/types';

interface JobCardProps {
  job: Job;
  groupSize: number;
  onClick?: () => void;
}

const JobCard: React.FC<JobCardProps> = ({ job, groupSize, onClick }) => {
  const [isExpanded, setIsExpanded] = React.useState(false);
  const content = job.Summary || job.Description || '';
  const hasLongContent = content.length > 200;

  const handleClick = (e: React.MouseEvent) => {
    // If clicking on the more button, don't trigger the main click
    if ((e.target as HTMLElement).closest('button')) {
      return;
    }

    // Open the job URL
    window.open(job.URL, '_blank');

    // Log the click
    if (onClick) {
      onClick();
    }
  };

  return (
    <div className="card" onClick={handleClick}>
      <div className="cardHeader">
        <h3 className="title" dangerouslySetInnerHTML={{ __html: job.Title || '' }} />
        {groupSize > 1 && <span className="groupBadge">
          {groupSize} jobs
        </span>}
      </div>
      <p className="company">
        <span dangerouslySetInnerHTML={{ __html: job.Company || '' }} /> - <span dangerouslySetInnerHTML={{ __html: job.Location || '' }} />
      </p>
      <div className="jobDetails">
        {job.Source && <span className="detail">Source: {job.Source}</span>}
        {job.hours && <span className="detail">Hours: {job.hours}</span>}
        {job.duration && <span className="detail">Duration: {job.duration}</span>}
      </div>
      <div className={isExpanded ? "descriptionExpanded" : "description"}>
        <p dangerouslySetInnerHTML={{ __html: content || '' }} />
      </div>
      {!isExpanded && hasLongContent && (
        <div className="fadeout"></div>
      )}
      {hasLongContent && (
        <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className="moreButton">
          {isExpanded ? 'Show less' : 'Show more...'}
        </button>
      )}
    </div>
  );
};

export default JobCard;
