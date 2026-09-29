-- ==========================================================
-- 003_listener_sync_triggers.sql
-- Real-time synchronization of active_listener_count in translation_rooms
-- ==========================================================

-- 1. Ensure indexes exist for high-concurrency audience counting
CREATE INDEX IF NOT EXISTS idx_audience_sessions_room_active
    ON public.audience_sessions(translation_room_id, left_at)
    WHERE left_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_audience_sessions_key_room
    ON public.audience_sessions(session_key, translation_room_id);

-- 2. Trigger function to automatically maintain translation_rooms.active_listener_count
CREATE OR REPLACE FUNCTION public.sync_room_listener_count()
RETURNS TRIGGER AS $$
DECLARE
    target_room_id UUID;
BEGIN
    -- Determine target room ID based on operation
    IF (TG_OP = 'DELETE') THEN
        target_room_id := OLD.translation_room_id;
    ELSE
        target_room_id := NEW.translation_room_id;
    END IF;

    -- Update active_listener_count for target room
    IF target_room_id IS NOT NULL THEN
        UPDATE public.translation_rooms
        SET active_listener_count = (
            SELECT COUNT(DISTINCT session_key)
            FROM public.audience_sessions
            WHERE translation_room_id = target_room_id
              AND left_at IS NULL
        ),
        updated_at = NOW()
        WHERE id = target_room_id;
    END IF;

    -- If translation_room_id changed during UPDATE, sync the previous room as well
    IF (TG_OP = 'UPDATE' AND OLD.translation_room_id IS DISTINCT FROM NEW.translation_room_id AND OLD.translation_room_id IS NOT NULL) THEN
        UPDATE public.translation_rooms
        SET active_listener_count = (
            SELECT COUNT(DISTINCT session_key)
            FROM public.audience_sessions
            WHERE translation_room_id = OLD.translation_room_id
              AND left_at IS NULL
        ),
        updated_at = NOW()
        WHERE id = OLD.translation_room_id;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Bind trigger to audience_sessions table for INSERT, UPDATE, and DELETE
DROP TRIGGER IF EXISTS trg_sync_room_listener_count ON public.audience_sessions;
CREATE TRIGGER trg_sync_room_listener_count
    AFTER INSERT OR UPDATE OR DELETE ON public.audience_sessions
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_room_listener_count();

-- 4. Initial one-time synchronization to ensure all existing rooms have accurate counts
UPDATE public.translation_rooms tr
SET active_listener_count = COALESCE((
    SELECT COUNT(DISTINCT session_key)
    FROM public.audience_sessions s
    WHERE s.translation_room_id = tr.id
      AND s.left_at IS NULL
), 0),
updated_at = NOW();
