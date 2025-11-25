SET session_replication_role = replica;

--
-- PostgreSQL database dump
--

-- \restrict 16tz03CSwX7oLWQDaqbtE9xgH4wcmMkhxbA02LNdIgdxdSgffmrrdIMjUVwOuSj

-- Dumped from database version 17.6
-- Dumped by pg_dump version 17.6

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Data for Name: audit_log_entries; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."audit_log_entries" ("instance_id", "id", "payload", "created_at", "ip_address") VALUES
	('00000000-0000-0000-0000-000000000000', 'f646a456-d92b-4c5b-a2e5-77e0f77c9de4', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"mathew.hebert@gmail.com","user_id":"7aa3fd06-b8bd-4ec3-9cb7-dae5fa44a4f2","user_phone":""}}', '2025-11-24 21:50:43.761492+00', ''),
	('00000000-0000-0000-0000-000000000000', '91e50294-9429-424d-9220-589d67de674d', '{"action":"user_deleted","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"user_email":"mathew.hebert@gmail.com","user_id":"7aa3fd06-b8bd-4ec3-9cb7-dae5fa44a4f2","user_phone":""}}', '2025-11-24 21:54:24.260766+00', ''),
	('00000000-0000-0000-0000-000000000000', '946ebdf0-7d59-43a5-851d-166e2a047cfd', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"mathew.hebert@gmail.com","user_id":"5216b64f-656c-44b2-bddf-019597e2cfda","user_phone":""}}', '2025-11-24 21:56:37.75065+00', ''),
	('00000000-0000-0000-0000-000000000000', 'd66cf3d9-2ef6-443b-bb10-b4c7faa506a5', '{"action":"user_signedup","actor_id":"00000000-0000-0000-0000-000000000000","actor_username":"service_role","actor_via_sso":false,"log_type":"team","traits":{"provider":"email","user_email":"john.smith@sunrisebio.com","user_id":"80db70d1-686b-40ba-9caa-3e58b969961d","user_phone":""}}', '2025-11-24 22:04:41.840883+00', '');


--
-- Data for Name: flow_state; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: users; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."users" ("instance_id", "id", "aud", "role", "email", "encrypted_password", "email_confirmed_at", "invited_at", "confirmation_token", "confirmation_sent_at", "recovery_token", "recovery_sent_at", "email_change_token_new", "email_change", "email_change_sent_at", "last_sign_in_at", "raw_app_meta_data", "raw_user_meta_data", "is_super_admin", "created_at", "updated_at", "phone", "phone_confirmed_at", "phone_change", "phone_change_token", "phone_change_sent_at", "email_change_token_current", "email_change_confirm_status", "banned_until", "reauthentication_token", "reauthentication_sent_at", "is_sso_user", "deleted_at", "is_anonymous") VALUES
	('00000000-0000-0000-0000-000000000000', '5216b64f-656c-44b2-bddf-019597e2cfda', 'authenticated', 'authenticated', 'mathew.hebert@gmail.com', '$2a$10$MhGfBt07ariuFqHYMc3TteyIn2qLomQnCO/o64..bw5Fp9mc7Ler6', '2025-11-24 21:56:37.751307+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-11-24 21:56:37.74903+00', '2025-11-24 21:56:37.751522+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false),
	('00000000-0000-0000-0000-000000000000', '80db70d1-686b-40ba-9caa-3e58b969961d', 'authenticated', 'authenticated', 'john.smith@sunrisebio.com', '$2a$10$pA.OYFa5XPdMVwMdqa/pzeMBiKxptfbIobseZlnZWeHBzJX5sKPTS', '2025-11-24 22:04:41.841184+00', NULL, '', NULL, '', NULL, '', '', NULL, NULL, '{"provider": "email", "providers": ["email"]}', '{"email_verified": true}', NULL, '2025-11-24 22:04:41.839546+00', '2025-11-24 22:04:41.841374+00', NULL, NULL, '', '', NULL, '', 0, NULL, '', NULL, false, NULL, false);


--
-- Data for Name: identities; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--

INSERT INTO "auth"."identities" ("provider_id", "user_id", "identity_data", "provider", "last_sign_in_at", "created_at", "updated_at", "id") VALUES
	('5216b64f-656c-44b2-bddf-019597e2cfda', '5216b64f-656c-44b2-bddf-019597e2cfda', '{"sub": "5216b64f-656c-44b2-bddf-019597e2cfda", "email": "mathew.hebert@gmail.com", "email_verified": false, "phone_verified": false}', 'email', '2025-11-24 21:56:37.749952+00', '2025-11-24 21:56:37.749969+00', '2025-11-24 21:56:37.749969+00', '32a163cc-e47b-4456-8aa2-7d0642fdf4e7'),
	('80db70d1-686b-40ba-9caa-3e58b969961d', '80db70d1-686b-40ba-9caa-3e58b969961d', '{"sub": "80db70d1-686b-40ba-9caa-3e58b969961d", "email": "john.smith@sunrisebio.com", "email_verified": false, "phone_verified": false}', 'email', '2025-11-24 22:04:41.840427+00', '2025-11-24 22:04:41.840444+00', '2025-11-24 22:04:41.840444+00', 'bd27ca7b-9c62-4f6c-99ab-a55ff1696732');


--
-- Data for Name: instances; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_clients; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sessions; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_amr_claims; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_factors; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: mfa_challenges; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_authorizations; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: oauth_consents; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: one_time_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: refresh_tokens; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_providers; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: saml_relay_states; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: sso_domains; Type: TABLE DATA; Schema: auth; Owner: supabase_auth_admin
--



--
-- Data for Name: companies; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."companies" ("id", "name", "website", "status", "created_at", "updated_at", "deleted_at", "created_by", "updated_by") VALUES
	('46b70129-9b3e-4fbc-bee0-69d08a663606', 'BayCare Medical Group', 'https://baycare.org/baycare-medical-group', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00', NULL, NULL, NULL);


--
-- Data for Name: dietary_restrictions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."dietary_restrictions" ("id", "key", "label", "description", "is_active", "created_at", "updated_at") VALUES
	('5894c7f4-c18c-4b3d-a8cb-7a1eb088cb67', 'vegetarian', 'Vegetarian', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00'),
	('6088e16f-d195-4de8-9f6a-524df3c98b8f', 'vegan', 'Vegan', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00'),
	('c38f5d9e-2fa2-42c5-bd47-3adc942afe22', 'gluten_free', 'Gluten-Free', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00'),
	('2fab19e2-ffec-4512-9552-cf380625c7e4', 'dairy_free', 'Dairy-Free', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00'),
	('bf6cc2fa-ab41-4a73-8553-d9c26b36d105', 'nut_free', 'Nut-Free', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00'),
	('97bfd070-4862-4079-98c0-5708b348d914', 'shellfish_free', 'Shellfish-Free', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00'),
	('82efafca-203a-42dd-b754-fa75f27450b7', 'halal', 'Halal', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00'),
	('eb092832-590c-4d73-9d16-647259eba0cb', 'kosher', 'Kosher', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00'),
	('d64a94cd-b5d9-4cb7-9751-5b6f474b8000', 'low_carb', 'Low Carb', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00'),
	('9070fe5b-8e85-43b6-8dfb-bad71f6dabde', 'low_sodium', 'Low Sodium', NULL, true, '2025-11-22 13:02:57.716457+00', '2025-11-22 13:02:57.716457+00');


--
-- Data for Name: food_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."food_categories" ("id", "key", "label", "description", "is_active", "created_at", "updated_at") VALUES
	('5071b09b-43ee-43b4-8b53-b49b16761913', 'pizza', 'Pizza', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('7a479ade-5ebc-4fc3-aa7d-fc8011cf0f50', 'salads', 'Salads', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('fc15804f-4c60-4e79-9fa8-6feb86790fd5', 'seafood', 'Seafood', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('67e0393a-0bfe-420b-9beb-1c8db9c78dda', 'japanese', 'Japanese', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('a91b9388-67bd-4346-8b72-5cb4829ca04c', 'italian', 'Italian', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('de041746-876d-4145-9d7c-8a28ba4e76e6', 'chinese', 'Chinese', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('0dfd32ef-3541-41c0-a497-8356f1c39871', 'indian', 'Indian', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('4b83a55e-7774-4c6c-a279-53bdfafa0b3a', 'mexican', 'Mexican', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('49dffb67-ed88-4738-b341-24a851c4e388', 'thai', 'Thai', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('467bcfe2-66cd-48ca-b7d1-ca213303d373', 'mediterranean', 'Mediterranean', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('c5569cc6-78a9-4002-8993-35dd52aafeef', 'burgers_and_sandwiches', 'Burgers and Sandwiches', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('9e9f01aa-2fcb-4858-8324-f522449e9c56', 'sushi', 'Sushi', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('9725cd92-54a9-43f6-97ac-e79218733b5c', 'breakfast', 'Breakfast (e.g., bagels, donuts)', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00'),
	('55a0b059-7726-4b84-9ddd-64b4ceb1673b', 'vietnamese', 'Vietnamese', NULL, true, '2025-11-22 13:02:52.003601+00', '2025-11-22 13:02:52.003601+00');


--
-- Data for Name: locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."locations" ("id", "company_id", "name", "address_line1", "address_line2", "city", "state", "postal_code", "country", "timezone", "phone", "status", "created_at", "updated_at", "deleted_at", "created_by", "updated_by") VALUES
	('67b701f9-67d8-4e57-9de9-1e5325f30228', '46b70129-9b3e-4fbc-bee0-69d08a663606', 'South Tampa Primary Care - Dale Mabry', '4541 S Dale Mabry Highway, Suite 100', NULL, 'Tampa', 'FL', '33611', 'US', 'America/New_York', '(813) 533-7030', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00', NULL, NULL, NULL),
	('891f3ed9-90a3-4c90-ab3f-5307122c5454', '46b70129-9b3e-4fbc-bee0-69d08a663606', 'Tampa Primary Care - MLK', '3440 W Dr Martin Luther King Jr Blvd, Suite 203', NULL, 'Tampa', 'FL', '33607', 'US', 'America/New_York', '(813) 872-7737', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00', NULL, NULL, NULL),
	('a4a6dd70-1889-477a-aba4-724009acd708', '46b70129-9b3e-4fbc-bee0-69d08a663606', 'Hyde Park Pediatrics', '1919 W Swann Ave, 2nd Floor', NULL, 'Tampa', 'FL', '33606', 'US', 'America/New_York', '(813) 254-7079', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00', NULL, NULL, NULL),
	('9b8f9fb4-47ad-45e1-bca5-094ae76c722c', '46b70129-9b3e-4fbc-bee0-69d08a663606', 'Hyde Park Adult Primary Care', '1919 W Swann Ave, 3rd Floor', NULL, 'Tampa', 'FL', '33606', 'US', 'America/New_York', '(813) 254-8055', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00', NULL, NULL, NULL);


--
-- Data for Name: food_preferences; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."food_preferences" ("id", "location_id", "scope", "notes", "created_at", "updated_at") VALUES
	('b2cded0a-845b-4530-8759-c5a1aba88e29', '67b701f9-67d8-4e57-9de9-1e5325f30228', 'location', 'Default location-level food preferences', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('66068869-86b2-43e2-b0d1-63ec53b61fd9', '891f3ed9-90a3-4c90-ab3f-5307122c5454', 'location', 'Default location-level food preferences', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('c41f80f5-2563-43fc-bc43-469d2605f736', 'a4a6dd70-1889-477a-aba4-724009acd708', 'location', 'Default location-level food preferences', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('93b68d57-e6ce-4abe-8895-d2764fdfe7d4', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 'location', 'Default location-level food preferences', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00');


--
-- Data for Name: food_preferences_dietary_restrictions; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."food_preferences_dietary_restrictions" ("id", "food_preference_id", "dietary_restriction_id", "created_at") VALUES
	('498ed60b-a2c9-4da5-9ae5-8bc77b4618f5', 'b2cded0a-845b-4530-8759-c5a1aba88e29', '5894c7f4-c18c-4b3d-a8cb-7a1eb088cb67', '2025-11-24 21:07:03.788455+00'),
	('690ecd8b-26cf-46bc-ba5b-f263cbe38769', 'b2cded0a-845b-4530-8759-c5a1aba88e29', 'c38f5d9e-2fa2-42c5-bd47-3adc942afe22', '2025-11-24 21:07:03.788455+00'),
	('19f62ddf-03c9-4b36-8084-6c57af8f5499', 'b2cded0a-845b-4530-8759-c5a1aba88e29', '2fab19e2-ffec-4512-9552-cf380625c7e4', '2025-11-24 21:07:03.788455+00'),
	('84fb4988-6482-47f3-9255-da8358238131', '66068869-86b2-43e2-b0d1-63ec53b61fd9', '5894c7f4-c18c-4b3d-a8cb-7a1eb088cb67', '2025-11-24 21:07:03.788455+00'),
	('634297b8-fbb4-4783-bac5-153193838279', '66068869-86b2-43e2-b0d1-63ec53b61fd9', 'c38f5d9e-2fa2-42c5-bd47-3adc942afe22', '2025-11-24 21:07:03.788455+00'),
	('1fde929b-aa92-4160-baca-e70cc40e0524', '66068869-86b2-43e2-b0d1-63ec53b61fd9', '2fab19e2-ffec-4512-9552-cf380625c7e4', '2025-11-24 21:07:03.788455+00'),
	('a6996875-0590-4106-84a3-bf96beb1fa0d', 'c41f80f5-2563-43fc-bc43-469d2605f736', '5894c7f4-c18c-4b3d-a8cb-7a1eb088cb67', '2025-11-24 21:07:03.788455+00'),
	('59f6dca1-71dd-47b1-a3cf-76a72f997db5', 'c41f80f5-2563-43fc-bc43-469d2605f736', 'c38f5d9e-2fa2-42c5-bd47-3adc942afe22', '2025-11-24 21:07:03.788455+00'),
	('5028790a-8a13-4039-823e-3ad5897c97cf', 'c41f80f5-2563-43fc-bc43-469d2605f736', '2fab19e2-ffec-4512-9552-cf380625c7e4', '2025-11-24 21:07:03.788455+00'),
	('50f18c79-7941-4ed3-b64f-83e4d0524850', '93b68d57-e6ce-4abe-8895-d2764fdfe7d4', '5894c7f4-c18c-4b3d-a8cb-7a1eb088cb67', '2025-11-24 21:07:03.788455+00'),
	('6027551b-152c-48e9-8029-63e579ab7991', '93b68d57-e6ce-4abe-8895-d2764fdfe7d4', 'c38f5d9e-2fa2-42c5-bd47-3adc942afe22', '2025-11-24 21:07:03.788455+00'),
	('07524f07-ab7e-4e8e-825f-e917bb5bdb96', '93b68d57-e6ce-4abe-8895-d2764fdfe7d4', '2fab19e2-ffec-4512-9552-cf380625c7e4', '2025-11-24 21:07:03.788455+00');


--
-- Data for Name: food_preferences_disliked_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."food_preferences_disliked_categories" ("id", "food_preference_id", "food_category_id", "created_at") VALUES
	('6701c1eb-8923-4003-a676-b2188c361588', 'c41f80f5-2563-43fc-bc43-469d2605f736', 'fc15804f-4c60-4e79-9fa8-6feb86790fd5', '2025-11-24 21:07:03.788455+00'),
	('b69b3439-3f01-4788-8999-133b05f968b4', '66068869-86b2-43e2-b0d1-63ec53b61fd9', '9725cd92-54a9-43f6-97ac-e79218733b5c', '2025-11-24 21:07:03.788455+00');


--
-- Data for Name: food_preferences_favorite_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."food_preferences_favorite_categories" ("id", "food_preference_id", "food_category_id", "created_at") VALUES
	('314c7893-6d19-42f4-97cd-6f7319535d53', '93b68d57-e6ce-4abe-8895-d2764fdfe7d4', '7a479ade-5ebc-4fc3-aa7d-fc8011cf0f50', '2025-11-24 21:07:03.788455+00'),
	('4c5df91d-ca0b-4b0f-b21b-9b3ad9ead74e', '93b68d57-e6ce-4abe-8895-d2764fdfe7d4', '467bcfe2-66cd-48ca-b7d1-ca213303d373', '2025-11-24 21:07:03.788455+00'),
	('c49f80f2-cf9d-4a6c-a028-a2d4e3a662a0', '93b68d57-e6ce-4abe-8895-d2764fdfe7d4', 'c5569cc6-78a9-4002-8993-35dd52aafeef', '2025-11-24 21:07:03.788455+00'),
	('7909ab03-9616-44b3-9d81-2f4562384f67', 'c41f80f5-2563-43fc-bc43-469d2605f736', '5071b09b-43ee-43b4-8b53-b49b16761913', '2025-11-24 21:07:03.788455+00'),
	('54b0d36b-ea6c-4895-b723-915bbd964ab1', 'c41f80f5-2563-43fc-bc43-469d2605f736', '7a479ade-5ebc-4fc3-aa7d-fc8011cf0f50', '2025-11-24 21:07:03.788455+00'),
	('e38e566d-1e89-445c-9f3a-c8e4427757df', 'c41f80f5-2563-43fc-bc43-469d2605f736', '9725cd92-54a9-43f6-97ac-e79218733b5c', '2025-11-24 21:07:03.788455+00'),
	('33b4fa67-a3df-46c7-84ba-519c17607c56', '66068869-86b2-43e2-b0d1-63ec53b61fd9', '7a479ade-5ebc-4fc3-aa7d-fc8011cf0f50', '2025-11-24 21:07:03.788455+00'),
	('d18f57eb-26bb-45e6-ae7b-d73e1edfee95', '66068869-86b2-43e2-b0d1-63ec53b61fd9', '4b83a55e-7774-4c6c-a279-53bdfafa0b3a', '2025-11-24 21:07:03.788455+00'),
	('aa0993da-f328-4a1a-8a84-420d138e1bfa', '66068869-86b2-43e2-b0d1-63ec53b61fd9', 'c5569cc6-78a9-4002-8993-35dd52aafeef', '2025-11-24 21:07:03.788455+00'),
	('38ce02d0-fa32-4e9d-8495-ca74dd85fa38', 'b2cded0a-845b-4530-8759-c5a1aba88e29', '67e0393a-0bfe-420b-9beb-1c8db9c78dda', '2025-11-24 21:07:03.788455+00'),
	('dfaffb2a-48e9-4fb4-9827-32da4a2614c0', 'b2cded0a-845b-4530-8759-c5a1aba88e29', '49dffb67-ed88-4738-b341-24a851c4e388', '2025-11-24 21:07:03.788455+00'),
	('542652dc-8a5a-4fa8-b961-9c055a7b604e', 'b2cded0a-845b-4530-8759-c5a1aba88e29', '9e9f01aa-2fcb-4858-8324-f522449e9c56', '2025-11-24 21:07:03.788455+00');


--
-- Data for Name: location_preferred_time_slots; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."location_preferred_time_slots" ("id", "location_id", "day_of_week", "start_time", "end_time", "meeting_type", "is_active", "created_at", "updated_at") VALUES
	('7c77853d-44c9-4c4b-bc2a-1bdc2bd021aa', '67b701f9-67d8-4e57-9de9-1e5325f30228', 1, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('3d85c6ec-1244-4fd8-a70a-6b3cc8d4b616', '891f3ed9-90a3-4c90-ab3f-5307122c5454', 1, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('00a476b4-6376-47ea-8baf-ddc2f92034ce', 'a4a6dd70-1889-477a-aba4-724009acd708', 1, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('2df10ab5-393d-4d23-9bcc-26a625dc331e', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 1, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('0eff8df5-a857-4f4f-bc8f-76b43bb0fbf3', '67b701f9-67d8-4e57-9de9-1e5325f30228', 2, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('1e88b361-dbb1-4ce4-9d24-72ef26391ccf', '891f3ed9-90a3-4c90-ab3f-5307122c5454', 2, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('3d1e0ce4-58b4-43b9-9ee1-630928e390c1', 'a4a6dd70-1889-477a-aba4-724009acd708', 2, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('d4df35d1-c82d-4670-ad41-6f5f59b8b81f', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 2, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('b8047be6-8b26-4720-bea7-88286f77ddc1', '67b701f9-67d8-4e57-9de9-1e5325f30228', 3, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('291622bb-71ad-40f8-a80f-16de3e7c9f4a', '891f3ed9-90a3-4c90-ab3f-5307122c5454', 3, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('6f1ff7f8-da3b-4d50-94bc-9e0dec2e3ca3', 'a4a6dd70-1889-477a-aba4-724009acd708', 3, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('4e9970be-d15b-4c84-b482-a3620ddb5c2a', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 3, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('9ac1018e-d459-4d62-813a-d639662b70c7', '67b701f9-67d8-4e57-9de9-1e5325f30228', 4, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('cea94e91-5205-435f-b44f-d3c7953019bd', '891f3ed9-90a3-4c90-ab3f-5307122c5454', 4, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('62b6c782-ee52-4c88-8cbe-79731ef7aee3', 'a4a6dd70-1889-477a-aba4-724009acd708', 4, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('0c8a905d-63a5-45bf-8684-81576daf70ba', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 4, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('2773d504-5970-43de-856d-611aa94c912b', '67b701f9-67d8-4e57-9de9-1e5325f30228', 5, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('5f7d3cfc-349d-48af-9dcf-3d2d2ff3f95f', '891f3ed9-90a3-4c90-ab3f-5307122c5454', 5, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('ffa34ccc-f588-47e7-97f4-47ee3a42e973', 'a4a6dd70-1889-477a-aba4-724009acd708', 5, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('4db91c2d-5a5e-4abb-a591-23bda59201b6', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 5, '11:30:00', '13:00:00', 'catered_lunch', true, '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00');


--
-- Data for Name: profiles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."profiles" ("id", "full_name", "email", "phone", "user_type", "default_company_id", "default_location_id", "status", "created_at", "updated_at") VALUES
	('80db70d1-686b-40ba-9caa-3e58b969961d', 'John Smith', 'john.smith@sunrisebio.com', NULL, 'rep', '46b70129-9b3e-4fbc-bee0-69d08a663606', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 'active', '2025-11-24 22:10:09.359231+00', '2025-11-24 22:10:09.359231+00'),
	('5216b64f-656c-44b2-bddf-019597e2cfda', 'Mathew Hebert', 'mathew.hebert@gmail.com', NULL, 'admin', '46b70129-9b3e-4fbc-bee0-69d08a663606', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 'active', '2025-11-24 22:10:09.359231+00', '2025-11-24 22:10:09.359231+00');


--
-- Data for Name: medical_reps; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."medical_reps" ("id", "profile_id", "company_name", "territory", "specialty_areas", "status", "created_at", "updated_at") VALUES
	('c9af740d-72bc-4c42-b890-7c70fdbc5a63', NULL, 'Acme Pharma', 'Tampa Core', '{cardiology,general_med}', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('7c05f408-45e8-42d6-9989-02aec874dd81', NULL, 'Sunrise Biotech', 'South Tampa', '{endocrinology,primary_care}', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('4c77ec48-a133-404e-88fe-bcbd38eaecdd', '80db70d1-686b-40ba-9caa-3e58b969961d', 'Sunrise Biotech', 'Hyde Park / Tampa', '{primary_care}', 'active', '2025-11-24 22:10:09.359231+00', '2025-11-24 22:10:09.359231+00');


--
-- Data for Name: medical_rep_locations; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."medical_rep_locations" ("id", "medical_rep_id", "location_id", "relationship_status", "created_at", "updated_at") VALUES
	('8b4df5ca-2010-4b02-8d77-487722097a0c', 'c9af740d-72bc-4c42-b890-7c70fdbc5a63', '891f3ed9-90a3-4c90-ab3f-5307122c5454', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('05260a9e-5193-462b-9cae-91765ad18939', 'c9af740d-72bc-4c42-b890-7c70fdbc5a63', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('59d66df9-6a0c-4f7c-9ee6-f6664ada1761', '7c05f408-45e8-42d6-9989-02aec874dd81', '67b701f9-67d8-4e57-9de9-1e5325f30228', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('bb2b3e20-6966-4813-9fda-7a86a2d99cbe', '7c05f408-45e8-42d6-9989-02aec874dd81', 'a4a6dd70-1889-477a-aba4-724009acd708', 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('f0fc79ba-21ae-496e-8fbf-4b8ce0185b24', '4c77ec48-a133-404e-88fe-bcbd38eaecdd', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 'active', '2025-11-24 22:10:09.359231+00', '2025-11-24 22:10:09.359231+00');


--
-- Data for Name: providers; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."providers" ("id", "location_id", "profile_id", "first_name", "last_name", "credential", "specialty", "email", "phone", "status", "created_at", "updated_at") VALUES
	('d71172b0-a9a5-45e7-8a26-92f790232389', 'a4a6dd70-1889-477a-aba4-724009acd708', NULL, 'Marcy Solomon', 'Baker', 'MD', 'Pediatrics', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('458455cd-773a-4f4c-9259-9bcdeb794a05', 'a4a6dd70-1889-477a-aba4-724009acd708', NULL, 'Amy L.', 'Bearison', 'MD', 'Pediatrics', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('c98e362d-4ffa-4270-8935-782bd526f9e0', 'a4a6dd70-1889-477a-aba4-724009acd708', NULL, 'Robert A.', 'Kickish', 'MD, FAAP', 'Pediatrics', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('e07b1803-4bf9-4ac5-a3b4-852ea6a182bf', 'a4a6dd70-1889-477a-aba4-724009acd708', NULL, 'Jennifer', 'Pesce', 'MD', 'Pediatrics', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('f5df7329-dc13-478d-821c-cfe596944670', 'a4a6dd70-1889-477a-aba4-724009acd708', NULL, 'Amy Mason', 'Phillips', 'MD', 'Pediatrics', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('1f7e6c7d-0c3d-42d4-b7e9-0139c87213ac', 'a4a6dd70-1889-477a-aba4-724009acd708', NULL, 'Solimar', 'Salud', 'MD', 'Pediatrics', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('1a738709-5b83-4a29-982d-c50bcd677e5b', 'a4a6dd70-1889-477a-aba4-724009acd708', NULL, 'Courtney L.', 'Kerzner', 'MSN, APRN, CPNP', 'Pediatric Nurse Practitioner', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('bc093a63-dafc-4f61-886b-9745e864c955', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', NULL, 'Shahla Goodarzi', 'Amrooei', 'MD', 'Family Medicine', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('3e5554e8-0957-45e5-866d-1e5cf6639130', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', NULL, 'Rizwanuddin Mohammed', 'Farooqi', 'MD', 'Family Medicine', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('04fd2987-4db0-43e1-a60d-93e65e68f534', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', NULL, 'Danielle N.', 'Hebert', 'APRN', 'Nurse Practitioner', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('71b28151-05ec-4551-9e61-c6a3c975efc6', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', NULL, 'Sheallah Ann Preston', 'Palmer', 'MD', 'Family Medicine', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('6654c190-1494-4388-96e4-493e4ba9c87a', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', NULL, 'Dipali Shireesh', 'Patel', 'MD', 'Family Medicine', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('f4ce7c2b-06ca-4874-91aa-4ee69f6d4a49', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', NULL, 'Nancy Marie M.', 'Seufert', 'APRN', 'Nurse Practitioner', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('c843ea7b-ba98-44ef-8ba6-41c6d377eb96', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', NULL, 'Laura Marie', 'Talakkottur', 'APRN', 'Nurse Practitioner', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('8f41ead2-af92-4590-862a-c9251a9ec2f2', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', NULL, 'Tisha Delise', 'Van Pelt', 'MD', 'Family Medicine', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('788add4b-ddcb-4366-b6dd-b387823b0338', '891f3ed9-90a3-4c90-ab3f-5307122c5454', NULL, 'Herman', 'Hans', 'MD', 'Primary Care', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('e529aee1-d8c2-4d1e-9bd1-0652daa19ecd', '891f3ed9-90a3-4c90-ab3f-5307122c5454', NULL, 'Nicole', 'Lang', 'DO', 'Primary Care', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('ee7d33d5-5221-49a3-b6b1-65ab24d6859c', '891f3ed9-90a3-4c90-ab3f-5307122c5454', NULL, 'Son D.', 'Nguyen', 'MD', 'Primary Care', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('209ea005-2e2c-4630-94bb-b779107b1a52', '891f3ed9-90a3-4c90-ab3f-5307122c5454', NULL, 'Smitha', 'Pabbathi', 'MD', 'Primary Care', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('ac36282b-5a73-4a46-97d5-cd90131302b8', '891f3ed9-90a3-4c90-ab3f-5307122c5454', NULL, 'LaToya', 'Carpenter', 'APRN', 'Nurse Practitioner', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('0c996ea6-5c4d-4665-a087-02685834ebe7', '67b701f9-67d8-4e57-9de9-1e5325f30228', NULL, 'Zachary', 'Milano', 'DO', 'Primary Care', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('31455b3b-d709-4a7f-8d85-20cca65157cb', '67b701f9-67d8-4e57-9de9-1e5325f30228', NULL, 'Janak A.', 'Patel', 'MD', 'Primary Care', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('1a200ab6-80e1-4f2d-a389-f253b775f49b', '67b701f9-67d8-4e57-9de9-1e5325f30228', NULL, 'Alycia', 'Saini', 'MD', 'Primary Care', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00'),
	('7f1bf223-4fd2-41ce-b50d-7ed2e9b53549', '67b701f9-67d8-4e57-9de9-1e5325f30228', NULL, 'Christopher', 'Aguilar', 'APRN', 'Nurse Practitioner', NULL, NULL, 'active', '2025-11-24 21:07:03.788455+00', '2025-11-24 21:07:03.788455+00');


--
-- Data for Name: meetings; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: postgres
--



--
-- Data for Name: user_roles; Type: TABLE DATA; Schema: public; Owner: postgres
--

INSERT INTO "public"."user_roles" ("id", "profile_id", "location_id", "role", "status", "created_at", "updated_at") VALUES
	('1ee69482-51de-4c19-bff7-c537847ed845', '80db70d1-686b-40ba-9caa-3e58b969961d', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 'rep', 'active', '2025-11-24 22:10:09.359231+00', '2025-11-24 22:10:09.359231+00'),
	('e16bece8-97a3-4cfb-a841-53e45de38473', '5216b64f-656c-44b2-bddf-019597e2cfda', '9b8f9fb4-47ad-45e1-bca5-094ae76c722c', 'location_admin', 'active', '2025-11-24 22:10:09.359231+00', '2025-11-24 22:10:09.359231+00');


--
-- Data for Name: buckets; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_analytics; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: buckets_vectors; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_namespaces; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: iceberg_tables; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: objects; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: prefixes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: s3_multipart_uploads_parts; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: vector_indexes; Type: TABLE DATA; Schema: storage; Owner: supabase_storage_admin
--



--
-- Data for Name: hooks; Type: TABLE DATA; Schema: supabase_functions; Owner: supabase_functions_admin
--



--
-- Name: refresh_tokens_id_seq; Type: SEQUENCE SET; Schema: auth; Owner: supabase_auth_admin
--

SELECT pg_catalog.setval('"auth"."refresh_tokens_id_seq"', 1, false);


--
-- Name: hooks_id_seq; Type: SEQUENCE SET; Schema: supabase_functions; Owner: supabase_functions_admin
--

SELECT pg_catalog.setval('"supabase_functions"."hooks_id_seq"', 1, false);


--
-- PostgreSQL database dump complete
--

-- \unrestrict 16tz03CSwX7oLWQDaqbtE9xgH4wcmMkhxbA02LNdIgdxdSgffmrrdIMjUVwOuSj

RESET ALL;
