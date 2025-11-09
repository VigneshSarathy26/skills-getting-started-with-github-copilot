from copy import deepcopy

import pytest
from fastapi.testclient import TestClient

from src import app as app_module


@pytest.fixture(autouse=True)
def restore_activities():
	"""Restore the in-memory activities dictionary after each test to keep tests isolated."""
	original = deepcopy(app_module.activities)
	yield
	app_module.activities = original


client = TestClient(app_module.app)


def test_get_activities_returns_expected_structure():
	res = client.get("/activities")
	assert res.status_code == 200
	data = res.json()
	# basic expectations
	assert isinstance(data, dict)
	assert "Chess Club" in data
	assert isinstance(data["Chess Club"]["participants"], list)


def test_signup_and_prevent_duplicate():
	activity = "Basketball Team"
	email = "testuser@example.com"

	# ensure participant not present initially
	assert email not in app_module.activities[activity]["participants"]

	# sign up should succeed
	res = client.post(f"/activities/{activity}/signup?email={email}")
	assert res.status_code == 200
	assert "Signed up" in res.json().get("message", "")

	# duplicate signup should be rejected
	res2 = client.post(f"/activities/{activity}/signup?email={email}")
	assert res2.status_code == 400


def test_remove_participant_endpoint():
	activity = "Basketball Team"
	email = "remove_me@example.com"

	# sign up first
	r1 = client.post(f"/activities/{activity}/signup?email={email}")
	assert r1.status_code == 200

	# remove the participant
	r2 = client.delete(f"/activities/{activity}/participants?email={email}")
	assert r2.status_code == 200
	assert "Removed" in r2.json().get("message", "")

	# verify removal
	r3 = client.get("/activities")
	assert email not in r3.json()[activity]["participants"]
