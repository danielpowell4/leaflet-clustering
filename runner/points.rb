# client addresses for UES
# requested Oct 22 by Maddy for "Market Analysis"

in_range_classes = ClassType.joins(:service_package).where(service_packages: { service_type_id: ClientType.coding_space.service_type_ids })

active_students_by_id = {}

def empty_student_for(student)
  client = student.client

  {
    lat: client.address&.latitude.to_f,
    long: client.address&.longitude.to_f,
    revenue: 0,
    sessions: 0,
    semesters: [],
    locations: []
  }
end

no_address = []

in_range_classes.each do |class_type|
  class_type.sessions.each do |class_session|
    class_session.class_seats.each do |seat|
      student = seat.student
      student_key = student.id.to_s
      student_blob = active_students_by_id[student_key] || empty_student_for(student)
      next if student_blob[:lat].zero?

      location_name = class_type.location&.name || 'Unlisted'
      semester = class_type.semester || 'Unlisted'

      student_blob[:revenue] = student_blob[:revenue] + (seat.amount_paid || 0)
      student_blob[:sessions] = student_blob[:sessions] + 1
      student_blob[:semesters] << semester if student_blob[:semesters].exclude?(semester)
      student_blob[:locations] << location_name if student_blob[:locations].exclude?(location_name)

      active_students_by_id[student_key] = student_blob
    end
  end
end

report = active_students_by_id.map do |student_id, blob|
  { student_id: student_id, **blob }
end.filter { |blob| blob[:lat] && blob[:lat].positive? }
