-- Add unique constraint on user_id for upsert support
ALTER TABLE public.user_subscriptions ADD CONSTRAINT user_subscriptions_user_id_unique UNIQUE (user_id);

-- Allow service_role to manage subscriptions (for webhook)
CREATE POLICY "Service role can manage subscriptions"
ON public.user_subscriptions
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);