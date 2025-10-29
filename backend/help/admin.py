from django.contrib import admin
from .models import HelpCategory, FAQ, Tutorial, SupportRequest, FAQHelpful, ViewTracking

@admin.register(HelpCategory)
class HelpCategoryAdmin(admin.ModelAdmin):
    list_display = ['name', 'description', 'created_at']
    search_fields = ['name']
    ordering = ['name']

@admin.register(FAQ)
class FAQAdmin(admin.ModelAdmin):
    list_display = ['question', 'category', 'helpful_count', 'views', 'is_active', 'created_at']
    list_filter = ['category', 'is_active', 'created_at']
    search_fields = ['question', 'answer']
    ordering = ['-helpful_count', '-views']
    readonly_fields = ['helpful_count', 'views', 'created_at', 'updated_at']

@admin.register(Tutorial)
class TutorialAdmin(admin.ModelAdmin):
    list_display = ['title', 'category', 'difficulty', 'duration', 'views', 'is_active', 'created_at']
    list_filter = ['category', 'difficulty', 'is_active', 'created_at']
    search_fields = ['title', 'description']
    ordering = ['-views']
    readonly_fields = ['views', 'created_at', 'updated_at']

@admin.register(SupportRequest)
class SupportRequestAdmin(admin.ModelAdmin):
    list_display = ['subject', 'category', 'priority', 'status', 'created_by', 'created_at']
    list_filter = ['category', 'priority', 'status', 'created_at']
    search_fields = ['subject', 'message', 'created_by__username']
    ordering = ['-created_at']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at']

@admin.register(FAQHelpful)
class FAQHelpfulAdmin(admin.ModelAdmin):
    list_display = ['faq', 'user', 'created_at']
    list_filter = ['created_at']
    readonly_fields = ['created_at']

@admin.register(ViewTracking)
class ViewTrackingAdmin(admin.ModelAdmin):
    list_display = ['content_type', 'object_id', 'user', 'ip_address', 'created_at']
    list_filter = ['content_type', 'created_at']
    readonly_fields = ['created_at']
