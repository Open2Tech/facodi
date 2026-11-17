-- The worker claims owed decision emails through claim_suggestion_notifications (security invoker),
-- which reads suggestion_notifications_due: the worker role must be able to execute both.
grant execute on function facodi.suggestion_notifications_due(integer) to service_role;
