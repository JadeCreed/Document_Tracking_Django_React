from django.utils import timezone
from rest_framework.exceptions import ValidationError
from .models import Document, DocumentLog


def process_scan(document, scanning_user, scanning_office, notes=''):
    if document.status in (Document.Status.COMPLETED, Document.Status.RELEASED):
        raise ValidationError(f"This document is already '{document.status}'.")
    
    route = document.document_type.route
    next_position = document.route_position + 1

    # Check if we are already at the end (shouldn't happen with logic below)
    if next_position >= len(route):
        raise ValidationError("This document has already finished its route.")

    expected_office = route[next_position]

    # 1. VALIDATION: Only the NEXT office in the sequence can scan.
    if scanning_office != expected_office:
        raise ValidationError(
            f"Document is currently at '{document.current_office}'. "
            f"It must be received by '{expected_office}', not '{scanning_office}'."
        )
    
    now = timezone.now()
    time_spent = now - document.entered_current_office_at

    # 2. UPDATE STATE
    document.route_position = next_position
    document.current_handler = scanning_user
    document.entered_current_office_at = now
    
    # 3. SCALABLE COMPLETION LOGIC:
    # If this scan reached the LAST index in the route array, mark as Completed.
    # This works for [A, B, A] or [A, B, C, D, A] or even [A, B, C]
    if next_position == len(route) - 1:
        document.status = Document.Status.COMPLETED
        action_type = DocumentLog.Action.SCANNED_COMPLETE
    else:
        action_type = DocumentLog.Action.SCANNED_ADVANCE

    document.save()

    # 4. LOG FOR ANALYTICS
    DocumentLog.objects.create(
        document=document,
        action=action_type,
        office=scanning_office,
        acted_by=scanning_user,
        duration_at_office=time_spent,
        notes=notes,
    )
    return document

def release_to_citizen(document, releasing_user, notes=''):
    """
    Called by the origin office (e.g. BPLO) once the document is Completed,
    marking it as physically handed back to the citizen.
    """
    if document.status != Document.Status.COMPLETED:
        raise ValidationError(
            f"Only a 'completed' document can be released to the citizen. "
            f"This document is currently '{document.status}'."
        )

    document.status = Document.Status.RELEASED
    document.current_handler = releasing_user
    document.save()

    DocumentLog.objects.create(
        document=document,
        action=DocumentLog.Action.RELEASED,
        office=document.current_office,
        acted_by=releasing_user,
        notes=notes,
    )
    return document


def flag_missing(document, flagging_user, notes=''):
    """Marks a document as missing — can happen at any non-terminal state."""
    if document.status in (Document.Status.COMPLETED, Document.Status.RELEASED):
        raise ValidationError(f"Cannot flag a '{document.status}' document as missing.")

    document.status = Document.Status.MISSING
    document.save()

    DocumentLog.objects.create(
        document=document,
        action=DocumentLog.Action.FLAGGED_MISSING,
        office=document.current_office,
        acted_by=flagging_user,
        notes=notes,
    )
    return document


def return_to_origin(document, returning_user, notes=''):
    """
    Ibinabalik ang document sa pinagmulan (route_position 0)
    kapag may nakitang mali ang citizen o kailangan ng follow-up.
    """
    if document.status == Document.Status.RELEASED:
        raise ValidationError("Cannot return a document that has already been finalized/released.")

    # I-reset sa step 0 (BPLO)
    document.route_position = 0
    document.status = Document.Status.IN_PROGRESS
    document.current_handler = None # Tanggalin ang current handler para ma-scan ulit ng BPLO
    document.entered_current_office_at = timezone.now()
    document.save()

    DocumentLog.objects.create(
        document=document,
        action=DocumentLog.Action.FLAGGED_MISSING, # Pwede nating gamitin ito o gumawa ng bagong Action
        office=document.origin_office,
        acted_by=returning_user,
        notes=f"CITIZEN RETURNED: {notes}",
    )
    return document