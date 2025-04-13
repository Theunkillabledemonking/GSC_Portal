-- Add inherit_attributes column to timetable_events table
ALTER TABLE timetable_events
ADD COLUMN inherit_attributes TINYINT(1) NOT NULL DEFAULT 0 COMMENT '강의실 및 교수이름을 timetable에서 상속받을지 여부 (1: 상속, 0: 사용안함)' AFTER year;

-- Update existing records to have inherit_attributes = 1 for events with timetable_id that is not null
-- and don't have their own professor_name or room values
UPDATE timetable_events 
SET inherit_attributes = 1
WHERE timetable_id IS NOT NULL
  AND (professor_name IS NULL OR professor_name = '')
  AND (room IS NULL OR room = ''); 