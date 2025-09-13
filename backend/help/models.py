from django.db import models
from django.conf import settings
from django.utils import timezone

class HelpCategory(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        verbose_name_plural = "Help Categories"
        ordering = ['name']
    
    def __str__(self):
        return self.name

class FAQ(models.Model):
    question = models.CharField(max_length=500)
    answer = models.TextField()
    category = models.ForeignKey(HelpCategory, on_delete=models.CASCADE, related_name='faqs')
    helpful_count = models.PositiveIntegerField(default=0)
    views = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-helpful_count', '-views', 'question']
    
    def __str__(self):
        return self.question[:100]

class Tutorial(models.Model):
    DIFFICULTY_CHOICES = [
        ('beginner', 'Débutant'),
        ('intermediate', 'Intermédiaire'),
        ('advanced', 'Avancé'),
    ]
    
    title = models.CharField(max_length=200)
    description = models.TextField()
    duration = models.CharField(max_length=20)  # e.g., "15 min"
    category = models.ForeignKey(HelpCategory, on_delete=models.CASCADE, related_name='tutorials')
    difficulty = models.CharField(max_length=20, choices=DIFFICULTY_CHOICES)
    video_url = models.URLField(blank=True, null=True)
    views = models.PositiveIntegerField(default=0)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    
    class Meta:
        ordering = ['-views', 'title']
    
    def __str__(self):
        return self.title

class SupportRequest(models.Model):
    PRIORITY_CHOICES = [
        ('low', 'Faible'),
        ('medium', 'Moyenne'),
        ('high', 'Élevée'),
        ('urgent', 'Urgente'),
    ]
    
    STATUS_CHOICES = [
        ('open', 'Ouvert'),
        ('in_progress', 'En cours'),
        ('resolved', 'Résolu'),
        ('closed', 'Fermé'),
    ]
    
    CATEGORY_CHOICES = [
        ('technique', 'Technique'),
        ('fonctionnel', 'Fonctionnel'),
        ('formation', 'Formation'),
        ('facturation', 'Facturation'),
    ]
    
    subject = models.CharField(max_length=200)
    message = models.TextField()
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES)
    priority = models.CharField(max_length=10, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='open')
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='support_requests')
    assigned_to = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_support_requests')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.subject} - {self.get_status_display()}"
    
    def save(self, *args, **kwargs):
        if self.status == 'resolved' and not self.resolved_at:
            self.resolved_at = timezone.now()
        super().save(*args, **kwargs)

class FAQHelpful(models.Model):
    """Track which users found FAQs helpful"""
    faq = models.ForeignKey(FAQ, on_delete=models.CASCADE, related_name='helpful_votes')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['faq', 'user']
    
    def __str__(self):
        return f"{self.user.username} found '{self.faq.question[:50]}' helpful"

class ViewTracking(models.Model):
    """Track views for FAQs and Tutorials"""
    content_type = models.CharField(max_length=20, choices=[('faq', 'FAQ'), ('tutorial', 'Tutorial')])
    object_id = models.PositiveIntegerField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.content_type} view by {self.user or self.ip_address}"
