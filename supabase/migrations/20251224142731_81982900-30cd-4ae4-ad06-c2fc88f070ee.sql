-- Allow developers to delete vacations
CREATE POLICY "Developers can delete vacations"
ON public.vacations
FOR DELETE
USING (is_developer(auth.uid()));

-- Allow developers to delete leave requests
CREATE POLICY "Developers can delete leave requests"
ON public.leave_requests
FOR DELETE
USING (is_developer(auth.uid()));