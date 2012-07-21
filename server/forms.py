# -*- coding: utf-8 -*-
from django import forms


class RegistrationForm(forms.Form):
	first_name = forms.CharField(max_length=30, required=False)
	last_name = forms.CharField(max_length=30, required=False)
	username = forms.CharField(max_length=30)
	password = forms.CharField(widget=forms.PasswordInput(render_value=False))
	email = forms.EmailField()
	
class LoginForm(forms.Form):
    username = forms.CharField(max_length=30)
    password = forms.CharField(widget=forms.PasswordInput(render_value=False))

class FileApiForm(forms.Form):
	file_data = forms.FileField(required=True)
	parent_id = forms.CharField(max_length = 32, required = True)

class ZipApiForm(forms.Form):
	file_data = forms.FileField(required=True)
	parent_id = forms.CharField(max_length = 32, required = True)