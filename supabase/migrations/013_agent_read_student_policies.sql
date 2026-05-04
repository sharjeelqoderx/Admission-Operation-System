-- Allow agents to read profiles of students they created
CREATE POLICY "profile_select_agent"
ON profile FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM student s
        JOIN agent a ON a.id = s.created_by_agent_id
        WHERE s.profile_id = profile.id
        AND a.profile_id = auth.uid()
    )
);

-- Allow agents to read student rows they created
CREATE POLICY "student_select_agent"
ON student FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM agent a
        WHERE a.id = student.created_by_agent_id
        AND a.profile_id = auth.uid()
    )
);

-- Allow agents to read education of students they created
CREATE POLICY "education_select_agent"
ON education FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM student s
        JOIN agent a ON a.id = s.created_by_agent_id
        WHERE s.profile_id = education.profile_id
        AND a.profile_id = auth.uid()
    )
);
