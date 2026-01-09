-- Allow users to update their own sent messages (for editing)
CREATE POLICY "Users can update own sent messages" 
ON public.direct_messages 
FOR UPDATE 
USING (auth.uid() = sender_id);

-- Allow users to delete their own sent messages
CREATE POLICY "Users can delete own sent messages" 
ON public.direct_messages 
FOR DELETE 
USING (auth.uid() = sender_id);