import os
import json
from flask import Blueprint, request, current_app, Response

upload_bp = Blueprint("upload", __name__)

@upload_bp.route("/upload-pdf", methods=["GET"])
def upload_pdf():
    return Response(
        json.dumps({"message": "Upload PDF"}, indent=2), 
        mimetype="application/json",
        status=200
    )