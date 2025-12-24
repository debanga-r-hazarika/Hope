-- Combined income view (direct income + contributions as income)
-- Requires rpc function income_combined to be created

CREATE OR REPLACE FUNCTION income_combined()
RETURNS TABLE (
  id uuid,
  amount numeric,
  reason text,
  transaction_id text,
  payment_to text,
  paid_to_user text,
  payment_date date,
  payment_method text,
  description text,
  category text,
  created_at timestamptz,
  updated_at timestamptz,
  recorded_by uuid,
  source text,
  income_type text,
  bank_reference text,
  evidence_url text
) AS $$
  SELECT
    i.id,
    i.amount,
    i.reason,
    i.transaction_id,
    i.payment_to,
    i.paid_to_user,
    i.payment_date,
    i.payment_method,
    i.description,
    i.category,
    i.created_at,
    i.updated_at,
    i.recorded_by,
    COALESCE(i.source, 'income') AS source,
    i.income_type,
    i.bank_reference,
    i.evidence_url
  FROM income i
  UNION ALL
  SELECT
    c.id,
    c.amount,
    c.reason,
    c.transaction_id,
    c.payment_to,
    c.paid_to_user,
    c.payment_date,
    c.payment_method,
    c.description,
    c.category,
    c.created_at,
    c.updated_at,
    c.recorded_by,
    'contribution' AS source,
    'other' AS income_type,
    c.bank_reference,
    c.evidence_url
  FROM contributions c;
$$ LANGUAGE sql STABLE;

