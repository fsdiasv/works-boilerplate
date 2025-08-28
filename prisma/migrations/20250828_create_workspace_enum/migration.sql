-- Create WorkspaceRole enum type
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'WorkspaceRole') THEN
        CREATE TYPE "WorkspaceRole" AS ENUM ('owner', 'admin', 'member');
    END IF;
END $$;