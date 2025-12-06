-- Create function to create notifications
create or replace function "public"."create_notification"(
  p_recipient_profile_id uuid,
  p_notification_type text,
  p_title text,
  p_body text,
  p_metadata jsonb default null
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_notification_id uuid;
begin
  insert into "public"."notifications" (
    "recipient_profile_id",
    "notification_type",
    "title",
    "body",
    "metadata"
  )
  values (
    p_recipient_profile_id,
    p_notification_type,
    p_title,
    p_body,
    p_metadata
  )
  returning "id" into v_notification_id;
  
  return v_notification_id;
end;
$$;

-- Create trigger function for meeting status changes
create or replace function "public"."notify_meeting_status_change"()
returns trigger
language plpgsql
security definer
as $$
declare
  v_medical_rep_profile_id uuid;
  v_location_name text;
  v_notification_title text;
  v_notification_body text;
begin
  -- Only trigger on status changes to 'approved' or 'declined'
  if NEW.status != OLD.status and (NEW.status = 'approved' or NEW.status = 'declined') then
    -- Get medical rep's profile_id
    select mr.profile_id into v_medical_rep_profile_id
    from "public"."medical_reps" mr
    where mr.id = NEW.medical_rep_id
      and mr.status = 'active';
    
    -- Get location name
    select l.name into v_location_name
    from "public"."locations" l
    where l.id = NEW.location_id;
    
    -- Only create notification if we found the medical rep profile
    if v_medical_rep_profile_id is not null then
      if NEW.status = 'approved' then
        v_notification_title := 'Meeting Approved';
        v_notification_body := format('Your meeting at %s has been approved.', coalesce(v_location_name, 'the location'));
      else
        v_notification_title := 'Meeting Declined';
        v_notification_body := format('Your meeting at %s has been declined.', coalesce(v_location_name, 'the location'));
      end if;
      
      perform "public"."create_notification"(
        v_medical_rep_profile_id,
        'meeting_' || NEW.status,
        v_notification_title,
        v_notification_body,
        jsonb_build_object(
          'meeting_id', NEW.id,
          'location_id', NEW.location_id,
          'location_name', v_location_name
        )
      );
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Create trigger for meetings table
drop trigger if exists "meetings_notify_status_change" on "public"."meetings";
create trigger "meetings_notify_status_change"
  after update on "public"."meetings"
  for each row
  when (OLD.status is distinct from NEW.status)
  execute function "public"."notify_meeting_status_change"();

-- Create trigger function for location invitations
create or replace function "public"."notify_location_invitation"()
returns trigger
language plpgsql
security definer
as $$
declare
  v_medical_rep_profile_id uuid;
  v_location_name text;
begin
  -- Only trigger on INSERT with relationship_status='active'
  if NEW.relationship_status = 'active' then
    -- Get medical rep's profile_id
    select mr.profile_id into v_medical_rep_profile_id
    from "public"."medical_reps" mr
    where mr.id = NEW.medical_rep_id
      and mr.status = 'active';
    
    -- Get location name
    select l.name into v_location_name
    from "public"."locations" l
    where l.id = NEW.location_id;
    
    -- Only create notification if we found the medical rep profile
    if v_medical_rep_profile_id is not null then
      perform "public"."create_notification"(
        v_medical_rep_profile_id,
        'location_invited',
        'New Location Invitation',
        format('You have been invited to %s.', coalesce(v_location_name, 'a new location')),
        jsonb_build_object(
          'location_id', NEW.location_id,
          'location_name', v_location_name
        )
      );
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Create trigger for medical_rep_locations table
drop trigger if exists "medical_rep_locations_notify_invitation" on "public"."medical_rep_locations";
create trigger "medical_rep_locations_notify_invitation"
  after insert on "public"."medical_rep_locations"
  for each row
  execute function "public"."notify_location_invitation"();

-- Create trigger function for medication requests
create or replace function "public"."notify_medication_request"()
returns trigger
language plpgsql
security definer
as $$
declare
  v_medical_rep_profile_id uuid;
  v_location_name text;
  v_medication_name text;
  v_notification_title text;
  v_notification_body text;
begin
  -- Handle INSERT (status='requested')
  if TG_OP = 'INSERT' and NEW.status = 'requested' then
    -- Get medical rep's profile_id
    select mr.profile_id into v_medical_rep_profile_id
    from "public"."medical_reps" mr
    where mr.id = NEW.medical_rep_id
      and mr.status = 'active';
    
    -- Get location name
    select l.name into v_location_name
    from "public"."locations" l
    where l.id = NEW.location_id;
    
    -- Get medication name from medical_rep_medications -> medication_dosages -> medications
    select m.brand_name into v_medication_name
    from "public"."medical_rep_medications" mrm
    join "public"."medication_dosages" md on md.id = mrm.medication_dosage_id
    join "public"."medications" m on m.id = md.medication_id
    where mrm.id = NEW.medical_rep_medication_id;
    
    -- Only create notification if we found the medical rep profile
    if v_medical_rep_profile_id is not null then
      v_notification_title := 'Medication Requested';
      v_notification_body := format(
        '%s has requested %s at %s.',
        'Someone',
        coalesce(v_medication_name, 'a medication'),
        coalesce(v_location_name, 'a location')
      );
      
      perform "public"."create_notification"(
        v_medical_rep_profile_id,
        'medication_requested',
        v_notification_title,
        v_notification_body,
        jsonb_build_object(
          'medication_request_id', NEW.id,
          'location_id', NEW.location_id,
          'location_name', v_location_name,
          'medication_name', v_medication_name
        )
      );
    end if;
  end if;
  
  -- Handle UPDATE (status changed to 'cancelled')
  if TG_OP = 'UPDATE' and OLD.status != NEW.status and NEW.status = 'cancelled' then
    -- Get medical rep's profile_id
    select mr.profile_id into v_medical_rep_profile_id
    from "public"."medical_reps" mr
    where mr.id = NEW.medical_rep_id
      and mr.status = 'active';
    
    -- Get location name
    select l.name into v_location_name
    from "public"."locations" l
    where l.id = NEW.location_id;
    
    -- Get medication name
    select m.brand_name into v_medication_name
    from "public"."medical_rep_medications" mrm
    join "public"."medication_dosages" md on md.id = mrm.medication_dosage_id
    join "public"."medications" m on m.id = md.medication_id
    where mrm.id = NEW.medical_rep_medication_id;
    
    -- Only create notification if we found the medical rep profile
    if v_medical_rep_profile_id is not null then
      v_notification_title := 'Medication Request Cancelled';
      v_notification_body := format(
        'The request for %s at %s has been cancelled.',
        coalesce(v_medication_name, 'a medication'),
        coalesce(v_location_name, 'a location')
      );
      
      perform "public"."create_notification"(
        v_medical_rep_profile_id,
        'medication_cancelled',
        v_notification_title,
        v_notification_body,
        jsonb_build_object(
          'medication_request_id', NEW.id,
          'location_id', NEW.location_id,
          'location_name', v_location_name,
          'medication_name', v_medication_name
        )
      );
    end if;
  end if;
  
  return NEW;
end;
$$;

-- Create trigger for medication_requests table
drop trigger if exists "medication_requests_notify" on "public"."medication_requests";
create trigger "medication_requests_notify"
  after insert or update on "public"."medication_requests"
  for each row
  execute function "public"."notify_medication_request"();

