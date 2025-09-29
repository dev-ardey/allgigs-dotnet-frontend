import React from 'react';
import { Job } from '../../types';
import styles from './JobCard.module.css';

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
    <div className={styles.card} onClick={handleClick}>
      <div className={styles.cardHeader}>
        <h3 className={styles.title} dangerouslySetInnerHTML={{ __html: job.Title }} />
        {groupSize > 1 && <span className={styles.groupBadge}>{groupSize} jobs</span>}
      </div>
      <p className={styles.company}>
        <span dangerouslySetInnerHTML={{ __html: job.Company }} /> - <span dangerouslySetInnerHTML={{ __html: job.Location }} />
      </p>
      <div className={styles.jobDetails}>
        {job.Source && <span className={styles.detail}>Source: {job.Source}</span>}
        {job.hours && <span className={styles.detail}>Hours: {job.hours}</span>}
        {job.duration && <span className={styles.detail}>Duration: {job.duration}</span>}
      </div>
      <div className={isExpanded ? styles.descriptionExpanded : styles.description}>
        <p dangerouslySetInnerHTML={{ __html: content }} />
      </div>
      {!isExpanded && hasLongContent && (
         <div className={styles.fadeout}></div>
      )}
      {hasLongContent && (
        <button onClick={(e) => { e.stopPropagation(); setIsExpanded(!isExpanded); }} className={styles.moreButton}>
          {isExpanded ? 'Show less' : 'Show more...'}
        </button>
      )}
    </div>
  );
};

export default JobCard;
