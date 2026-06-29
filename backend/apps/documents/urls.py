from django.urls import path
from .views import (
    DocumentListCreateView, DocumentDetailView,
    DocumentScanView, DocumentReleaseView, DocumentFlagMissingView,
    DocumentTrackingLookupView, DocumentTypeListView,AdminDashboardStatsView, HeatmapDataView,DocumentExportView,DocumentTypeCreateView,
    ClaimDocumentView,MyDocumentsView,DocumentReturnView 
)

urlpatterns = [
    path('types/', DocumentTypeListView.as_view(), name='document-type-list'),
    path('', DocumentListCreateView.as_view(), name='document-list-create'),
    path('<int:pk>/', DocumentDetailView.as_view(), name='document-detail'),
    path('<int:pk>/scan/', DocumentScanView.as_view(), name='document-scan'),
    path('<int:pk>/release/', DocumentReleaseView.as_view(), name='document-release'),
    path('<int:pk>/flag-missing/', DocumentFlagMissingView.as_view(), name='document-flag-missing'),
    
    path('<int:pk>/export/', DocumentExportView.as_view(), name='document-export'),
    
    path('track/<str:tracking_number>/', DocumentTrackingLookupView.as_view(), name='document-track'),

    path('dashboard-stats/', AdminDashboardStatsView.as_view(), name='admin-stats'),
    path('heatmap/', HeatmapDataView.as_view(), name='heatmap-data'),

    path('types/create/', DocumentTypeCreateView.as_view(), name='document-type-create'),

    path('track/<str:tracking_number>/claim/', ClaimDocumentView.as_view(), name='document-claim'),
    
    path('my-requests/', MyDocumentsView.as_view(), name='my-documents'),

    path('<int:pk>/return/', DocumentReturnView.as_view(), name='document-return'),
]