export interface LiveEvent<T> {
  action: 'upsert' | 'delete';
  reason?: 'create' | 'update' | 'panic' | 'clear';
  actorId?: string | null;
  data: T;
}
