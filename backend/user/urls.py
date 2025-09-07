from django.urls import path
from .views import GroupList, LogList, UploadExcelView

urlpatterns = [
    path("groups/", GroupList.as_view(), name="group-list"),
    path("logs/", LogList.as_view(), name="log-list"),
    
    path("upload-excel/", UploadExcelView.as_view(), name="upload-excel"),
]

