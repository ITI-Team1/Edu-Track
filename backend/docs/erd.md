# Edu-Track ERD

This folder contains the Entity Relationship Diagram (ERD) for the backend data model.

## Regenerating the Diagram

If you modify models, regenerate the PNG:

```powershell
# From backend directory
python manage.py graph_models -a -g -o docs/erd.png
```

Requirements: install `django-extensions` and `pygraphviz`.

```powershell
pip install django-extensions pygraphviz
```

Then add `django_extensions` to `INSTALLED_APPS` in `edu_track/settings.py`.

## Diagram

See `erd.png` in this directory.
