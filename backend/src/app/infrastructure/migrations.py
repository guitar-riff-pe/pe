from sqlalchemy import inspect, text
from sqlalchemy.engine import Engine


def migrate_existing_tables(engine: Engine) -> None:
    """Add nullable columns to databases created before the frontend contract update.

    `create_all` creates new tables but never changes existing ones. All added fields
    are nullable so older accounts and rooms remain readable.
    """
    with engine.begin() as connection:
        inspector = inspect(connection)
        tables = set(inspector.get_table_names())
        if "accounts" in tables:
            columns = {item["name"] for item in inspector.get_columns("accounts")}
            if "email" not in columns:
                connection.execute(text("ALTER TABLE accounts ADD COLUMN email VARCHAR(320)"))
            connection.execute(
                text("CREATE UNIQUE INDEX IF NOT EXISTS ix_accounts_email ON accounts (email)")
            )
        if "rooms" in tables:
            columns = {item["name"] for item in inspector.get_columns("rooms")}
            additions = {
                "name": "VARCHAR(40)",
                "visibility": "VARCHAR(7)",
                "capacity": "INTEGER",
                "bars": "INTEGER",
                "style": "VARCHAR(32)",
                "closed_at": "TIMESTAMP",
            }
            for name, sql_type in additions.items():
                if name not in columns:
                    connection.execute(text(f"ALTER TABLE rooms ADD COLUMN {name} {sql_type}"))
