-- Clean up old data that contains HTML tags in the applying table
-- This script removes HTML tags from existing records

UPDATE applying 
SET 
  job_title_clicked = REGEXP_REPLACE(job_title_clicked, '<[^>]*>', '', 'g'),
  company_clicked = REGEXP_REPLACE(company_clicked, '<[^>]*>', '', 'g'),
  location_clicked = REGEXP_REPLACE(location_clicked, '<[^>]*>', '', 'g'),
  summary_clicked = REGEXP_REPLACE(summary_clicked, '<[^>]*>', '', 'g')
WHERE 
  job_title_clicked LIKE '%<%' 
  OR company_clicked LIKE '%<%' 
  OR location_clicked LIKE '%<%' 
  OR summary_clicked LIKE '%<%';

-- Also clean up any remaining HTML entities
UPDATE applying 
SET 
  job_title_clicked = REGEXP_REPLACE(job_title_clicked, '&[^;]+;', '', 'g'),
  company_clicked = REGEXP_REPLACE(company_clicked, '&[^;]+;', '', 'g'),
  location_clicked = REGEXP_REPLACE(location_clicked, '&[^;]+;', '', 'g'),
  summary_clicked = REGEXP_REPLACE(summary_clicked, '&[^;]+;', '', 'g')
WHERE 
  job_title_clicked LIKE '%&%' 
  OR company_clicked LIKE '%&%' 
  OR location_clicked LIKE '%&%' 
  OR summary_clicked LIKE '%&%'; 