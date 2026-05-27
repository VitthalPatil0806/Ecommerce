"""Add checkout and payment fields to orders.

Revision ID: 9f1f8f3d1b6f
Revises: 43da1ee2a3a3
Create Date: 2026-05-26 00:00:00.000000
"""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = "9f1f8f3d1b6f"
down_revision: Union[str, None] = "43da1ee2a3a3"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.add_column("orders", sa.Column("customer_name", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("customer_email", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("customer_phone", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("address_line1", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("address_line2", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("city", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("state", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("postal_code", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("country", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("payment_method", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("payment_status", sa.String(), nullable=True))
    op.add_column("orders", sa.Column("card_last4", sa.String(), nullable=True))


def downgrade() -> None:
    op.drop_column("orders", "card_last4")
    op.drop_column("orders", "payment_status")
    op.drop_column("orders", "payment_method")
    op.drop_column("orders", "country")
    op.drop_column("orders", "postal_code")
    op.drop_column("orders", "state")
    op.drop_column("orders", "city")
    op.drop_column("orders", "address_line2")
    op.drop_column("orders", "address_line1")
    op.drop_column("orders", "customer_phone")
    op.drop_column("orders", "customer_email")
    op.drop_column("orders", "customer_name")
