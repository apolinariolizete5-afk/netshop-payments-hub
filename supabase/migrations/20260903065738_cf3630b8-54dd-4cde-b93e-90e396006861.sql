CREATE POLICY "uploads read" ON storage.objects FOR SELECT TO anon, authenticated USING (bucket_id = 'uploads');
CREATE POLICY "uploads insert auth" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'uploads');
CREATE POLICY "uploads update auth" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'uploads' AND owner = auth.uid());
CREATE POLICY "uploads delete auth" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'uploads' AND owner = auth.uid());