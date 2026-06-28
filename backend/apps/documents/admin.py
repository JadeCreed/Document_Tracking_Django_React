from django.contrib import admin
from .models import Document, DocumentType, DocumentLog

@admin.register(DocumentType)
class DocumentTypeAdmin(admin.ModelAdmin):
    list_display = ('name', 'route', 'is_active')

@admin.register(Document)
class DocumentAdmin(admin.ModelAdmin):
    list_display = ('tracking_number', 'document_type', 'current_office', 'status', 'created_at')
    search_fields = ('tracking_number',)
    list_filter = ('status', 'document_type')

@admin.register(DocumentLog)
class DocumentLogAdmin(admin.ModelAdmin):
    list_display = ('document', 'action', 'office', 'acted_by', 'duration_at_office', 'timestamp')
    list_filter = ('office', 'action')