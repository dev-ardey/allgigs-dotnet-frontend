-- ==========================================
-- CLEANUP OLD RECORDS
-- Remove old applying records that don't have the new _clicked fields
-- ==========================================

-- Delete old records that don't have job_title_clicked field
-- This will remove records from before we added the new fields
DELETE FROM applying 
WHERE job_title_clicked IS NULL 
   OR job_title_clicked = '' 
   OR company_clicked IS NULL 
   OR company_clicked = '';

-- Optional: Show how many records were deleted
-- SELECT COUNT(*) as deleted_records FROM applying WHERE job_title_clicked IS NULL;

-- ==========================================
-- VERIFICATION
-- ==========================================
SELECT 'Cleanup completed' as status;
SELECT COUNT(*) as remaining_records FROM applying; 