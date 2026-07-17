import json
from sqlalchemy import event
from sqlalchemy.orm import Session
from sqlalchemy.orm.attributes import get_history
from app.models.all import AuditLog, User, AuditLog  # Assuming AuditLog exists in all.py

# A context var could be used here to track current user if needed,
# but for simplicity we'll check if the object has a modified_by or similar,
# or we just log user_id=None (system/unknown) for now unless we use contextvars.
import contextvars
from typing import Optional

current_user_id: contextvars.ContextVar[Optional[int]] = contextvars.ContextVar('current_user_id', default=None)

def serialize_val(val):
    import datetime
    if isinstance(val, (datetime.date, datetime.datetime)):
        return val.isoformat()
    # add other serialization if needed
    return val

def after_flush(session: Session, flush_context):
    user_id = current_user_id.get()
    audit_logs = []
    
    for obj in session.new:
        if isinstance(obj, AuditLog):
            continue
        new_values = {c.key: serialize_val(getattr(obj, c.key)) for c in obj.__mapper__.columns}
        audit_logs.append(
            AuditLog(
                user_id=user_id,
                action='INSERT',
                table_name=obj.__tablename__,
                new_values=new_values,
                # record_id might not be available until after commit for auto-increment PKs,
                # but we try to grab it if it's there
                record_id=getattr(obj, list(obj.__mapper__.primary_key)[0].key, None)
            )
        )
        
    for obj in session.dirty:
        if isinstance(obj, AuditLog):
            continue
        old_values = {}
        new_values = {}
        for c in obj.__mapper__.columns:
            history = get_history(obj, c.key)
            if history.has_changes():
                old_values[c.key] = serialize_val(history.deleted[0]) if history.deleted else None
                new_values[c.key] = serialize_val(history.added[0]) if history.added else None
        
        if old_values or new_values:
            audit_logs.append(
                AuditLog(
                    user_id=user_id,
                    action='UPDATE',
                    table_name=obj.__tablename__,
                    record_id=getattr(obj, list(obj.__mapper__.primary_key)[0].key, None),
                    old_values=old_values,
                    new_values=new_values
                )
            )
            
    for obj in session.deleted:
        if isinstance(obj, AuditLog):
            continue
        old_values = {c.key: serialize_val(getattr(obj, c.key)) for c in obj.__mapper__.columns}
        audit_logs.append(
            AuditLog(
                user_id=user_id,
                action='DELETE',
                table_name=obj.__tablename__,
                record_id=getattr(obj, list(obj.__mapper__.primary_key)[0].key, None),
                old_values=old_values
            )
        )
        
    if audit_logs:
        # Add to session so they are committed with the current transaction
        session.add_all(audit_logs)

def setup_audit_logging():
    event.listen(Session, 'after_flush', after_flush)
