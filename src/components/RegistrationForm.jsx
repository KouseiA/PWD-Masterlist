import React, { useState } from 'react';
import { X, Check, User, Fingerprint, Cake, MapPin } from 'lucide-react';

const parseFullName = (fullName = '') => {
  if (!fullName || typeof fullName !== 'string') {
    return { surname: '', firstName: '', middleName: '' };
  }
  const str = fullName.trim();
  if (str.includes(',')) {
    const parts = str.split(',');
    const surname = parts[0].trim();
    const rest = parts.slice(1).join(',').trim().split(/\s+/).filter(Boolean);
    if (rest.length === 0) {
      return { surname, firstName: '', middleName: '' };
    } else if (rest.length === 1) {
      return { surname, firstName: rest[0], middleName: '' };
    } else {
      const middleName = rest.pop();
      const firstName = rest.join(' ');
      return { surname, firstName, middleName };
    }
  } else {
    const words = str.split(/\s+/).filter(Boolean);
    if (words.length === 0) {
      return { surname: '', firstName: '', middleName: '' };
    } else if (words.length === 1) {
      return { surname: '', firstName: words[0], middleName: '' };
    } else if (words.length === 2) {
      return { surname: words[1], firstName: words[0], middleName: '' };
    } else {
      const firstName = words[0];
      const middleName = words[1];
      const surname = words.slice(2).join(' ');
      return { surname, firstName, middleName };
    }
  }
};

const constructFullName = (surname, firstName, middleName) => {
  const sur = (surname || '').trim();
  const first = (firstName || '').trim();
  const middle = (middleName || '').trim();

  return [sur, first, middle].filter(Boolean).join(' ');
};

const MONTHS = [
  { value: '01', label: 'Jan (01)' },
  { value: '02', label: 'Feb (02)' },
  { value: '03', label: 'Mar (03)' },
  { value: '04', label: 'Apr (04)' },
  { value: '05', label: 'May (05)' },
  { value: '06', label: 'Jun (06)' },
  { value: '07', label: 'Jul (07)' },
  { value: '08', label: 'Aug (08)' },
  { value: '09', label: 'Sep (09)' },
  { value: '10', label: 'Oct (10)' },
  { value: '11', label: 'Nov (11)' },
  { value: '12', label: 'Dec (12)' },
];

const CURRENT_YEAR = new Date().getFullYear();
const YEARS = Array.from({ length: CURRENT_YEAR - 1912 + 1 }, (_, i) => String(CURRENT_YEAR - i));
const DAYS = Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'));

const getAgeInfo = (birthdayStr) => {
  if (!birthdayStr) return null;
  const parts = birthdayStr.split('-');
  if (parts.length < 3 || !parts[0] || !parts[1] || !parts[2]) return null;

  const birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
  if (isNaN(birthDate.getTime())) return null;

  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }

  if (age < 0 || age > 120) return null;

  let category = 'Adult';
  if (age >= 60) category = 'Senior Citizen';
  else if (age < 18) category = 'Minor';

  return { age, category };
};

const RegistrationForm = ({
  onSubmit,
  onCancel,
  initialData,
  existingMembers = [],
  settings,
  getIDStatus,
}) => {
  const [formData, setFormData] = useState(() => {
    let initialName = initialData?.name || '';
    let parsed = {
      surname: initialData?.surname || '',
      firstName: initialData?.firstName || '',
      middleName: initialData?.middleName || '',
    };

    if (!parsed.surname && !parsed.firstName && initialName) {
      parsed = parseFullName(initialName);
    }

    const constructedName = initialName || constructFullName(parsed.surname, parsed.firstName, parsed.middleName);

    if (initialData) {
      return {
        contact: '',
        address: '',
        status: 'Active',
        ...initialData,
        surname: parsed.surname,
        firstName: parsed.firstName,
        middleName: parsed.middleName,
        name: constructedName,
      };
    }

    return {
      id: '',
      surname: '',
      firstName: '',
      middleName: '',
      name: '',
      birthday: '',
      contact: '',
      address: '',
      status: 'Active',
    };
  });

  const [touched, setTouched] = useState({});

  const birthYear = formData.birthday && formData.birthday.includes('-') ? formData.birthday.split('-')[0] : '';
  const birthMonth = formData.birthday && formData.birthday.includes('-') ? formData.birthday.split('-')[1] : '';
  const birthDay = formData.birthday && formData.birthday.includes('-') ? formData.birthday.split('-')[2] : '';
  const ageInfo = getAgeInfo(formData.birthday);

  const handleDateSegmentChange = (segment, value) => {
    const currentParts = formData.birthday && formData.birthday.includes('-')
      ? formData.birthday.split('-')
      : [String(CURRENT_YEAR), '01', '01'];

    let year = currentParts[0] || String(CURRENT_YEAR);
    let month = currentParts[1] || '01';
    let day = currentParts[2] || '01';

    if (segment === 'year') year = value;
    if (segment === 'month') month = value;
    if (segment === 'day') day = value;

    if (year && month && day) {
      const formatted = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
      setFormData((prev) => ({ ...prev, birthday: formatted }));
      setTouched((prev) => ({ ...prev, birthday: true }));
    }
  };

  const idStatus = (() => {
    const cleanId = (formData.id || '').trim();
    if (!cleanId) return null;
    if (typeof getIDStatus === 'function') {
      return getIDStatus(cleanId, formData.status);
    }
    const activePattern = settings?.active_pattern || '03-1412';
    const expiredPatterns = (settings?.expired_patterns || '03-1402, 03-14-02')
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);

    if (cleanId.startsWith(activePattern)) {
      return { label: 'Active', color: '#10b981' };
    }
    return { label: 'Expired', color: '#f59e0b' };
  })();

  const validate = (data) => {
    const errors = {};
    if (!data.surname || !data.surname.trim()) {
      errors.surname = 'Surname (Last Name) is required.';
    }
    if (!data.firstName || !data.firstName.trim()) {
      errors.firstName = 'First Name is required.';
    }
    if (!data.name || data.name.trim().length < 3) {
      errors.name = 'Full name must be at least 3 characters.';
    }
    if (!data.id || data.id.trim().length < 5) {
      errors.id = 'PWD ID is required (min 5 characters).';
    }
    if (!data.birthday) {
      errors.birthday = 'Birthday is required.';
    }
    if (data.contact && data.contact.trim().length > 30) {
      errors.contact = 'Contact must be under 30 characters.';
    }
    if (data.address && data.address.trim().length > 200) {
      errors.address = 'Address must be under 200 characters.';
    }
    return errors;
  };

  const errors = validate(formData);
  const isValid = Object.keys(errors).length === 0;

  const trimmedId = formData.id.trim();
  const duplicateMember =
    trimmedId.length >= 5
      ? existingMembers.find(
          (m) => m.id === trimmedId && m.id !== initialData?.id,
        )
      : null;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleNameInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => {
      const updated = { ...prev, [name]: value };
      const combined = constructFullName(
        updated.surname,
        updated.firstName,
        updated.middleName
      );
      return { ...updated, name: combined };
    });
    setTouched((prev) => ({ ...prev, [name]: true, name: true, surname: true, firstName: true }));
  };

  const handleBlur = (e) => {
    setTouched((prev) => ({ ...prev, [e.target.name]: true }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="registration-container">
      <div className="form-header">
        <div className="header-info">
          <h1>{initialData ? 'Edit Member Record' : 'Add New Member'}</h1>
          <p>
            {initialData
              ? `Editing PWD ID: ${formData.id}`
              : 'Register a new PWD by filling the form manually.'}
          </p>
        </div>
        <button className="btn btn-secondary" onClick={onCancel}>
          <X size={18} /> Cancel
        </button>
      </div>

      <form className="member-form" onSubmit={handleSubmit}>
        <div className="form-sections">
          <div className="form-main">
            <div className="card form-card">
              <div className="form-section-title">
                <User size={18} />
                <h3>Member Information</h3>
              </div>

              <div className="bento-form-grid">
                {/* Bento Card 1: Personal Details */}
                <div className="bento-card span-2">
                  <div className="bento-card-header">
                    <div className="icon-badge"><User size={18} /></div>
                    <span>1. Personal Details</span>
                  </div>

                  <div className="name-fields-grid">
                    <div className="input-group">
                      <label>Surname / Last Name *</label>
                      <input
                        name="surname"
                        value={formData.surname || ''}
                        onChange={handleNameInputChange}
                        onBlur={handleBlur}
                        placeholder="e.g. Dela Cruz"
                        className={
                          touched.surname && errors.surname
                            ? 'input-error'
                            : touched.surname && !errors.surname && formData.surname
                            ? 'input-valid'
                            : ''
                        }
                      />
                      {touched.surname && errors.surname && (
                        <span className="field-error">{errors.surname}</span>
                      )}
                    </div>

                    <div className="input-group">
                      <label>First Name *</label>
                      <input
                        name="firstName"
                        value={formData.firstName || ''}
                        onChange={handleNameInputChange}
                        onBlur={handleBlur}
                        placeholder="e.g. Juan"
                        className={
                          touched.firstName && errors.firstName
                            ? 'input-error'
                            : touched.firstName && !errors.firstName && formData.firstName
                            ? 'input-valid'
                            : ''
                        }
                      />
                      {touched.firstName && errors.firstName && (
                        <span className="field-error">{errors.firstName}</span>
                      )}
                    </div>

                    <div className="input-group">
                      <label>
                        Middle Name{' '}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.82em' }}>
                          (optional)
                        </span>
                      </label>
                      <input
                        name="middleName"
                        value={formData.middleName || ''}
                        onChange={handleNameInputChange}
                        onBlur={handleBlur}
                        placeholder="e.g. Santos"
                      />
                    </div>
                  </div>

                  {formData.name && (
                    <div className="name-preview-hint">
                      Full Name Preview: <strong>{formData.name}</strong>
                    </div>
                  )}
                </div>

                {/* Bento Card 2: PWD Registration & Status */}
                <div className="bento-card">
                  <div className="bento-card-header">
                    <div className="icon-badge"><Fingerprint size={18} /></div>
                    <span>2. PWD ID & Status</span>
                  </div>

                  <div className="input-group">
                    <div className="label-with-badge">
                      <label>PWD ID Number *</label>
                      {idStatus && (
                        <span
                          className="id-status-badge"
                          style={{
                            backgroundColor: `${idStatus.color}18`,
                            color: idStatus.color,
                            borderColor: `${idStatus.color}45`,
                          }}
                        >
                          <span
                            className="status-dot"
                            style={{ backgroundColor: idStatus.color }}
                          />
                          {idStatus.label} ID
                        </span>
                      )}
                    </div>

                    <input
                      name="id"
                      value={formData.id}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      placeholder="e.g. 03-1412-000-1234"
                      className={
                        touched.id && errors.id
                          ? 'input-error'
                          : touched.id && !errors.id
                          ? 'input-valid'
                          : ''
                      }
                    />

                    <div className="id-instruction-hint">
                      💡 <span>Type the PWD ID prefix to check if Active or Expired.</span>
                    </div>

                    <div className="id-pattern-preview-box">
                      <div className="pattern-item active-pattern" title="IDs starting with this pattern are considered ACTIVE">
                        <span className="pattern-tag">ACTIVE PREFIX:</span>
                        <code>{settings?.active_pattern || '03-1412'}</code>
                      </div>
                      <div className="pattern-item expired-pattern" title="IDs starting with these patterns are considered EXPIRED">
                        <span className="pattern-tag">EXPIRED PREFIXES:</span>
                        <code>{settings?.expired_patterns || '03-1402, 03-14-02'}</code>
                      </div>
                    </div>

                    {touched.id && errors.id && (
                      <span className="field-error">{errors.id}</span>
                    )}
                    {duplicateMember && (
                      <span className="field-error field-duplicate">
                        ⚠ This ID already exists — <strong>{duplicateMember.name}</strong>
                      </span>
                    )}
                  </div>

                  <div className="input-group" style={{ marginTop: '0.75rem' }}>
                    <label>Member Status</label>
                    <select
                      name="status"
                      value={formData.status || 'Active'}
                      onChange={handleInputChange}
                      onBlur={handleBlur}
                      className="form-select"
                    >
                      <option value="Active">Active</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>

                {/* Bento Card 3: Date of Birth */}
                <div className="bento-card">
                  <div className="bento-card-header">
                    <div className="icon-badge"><Cake size={18} /></div>
                    <span>3. Date of Birth</span>
                  </div>

                  <div className="input-group">
                    <div className="label-with-badge">
                      <label>Birthday *</label>
                      {ageInfo && (
                        <span className={`age-info-badge ${ageInfo.category === 'Senior Citizen' ? 'senior' : ageInfo.category === 'Minor' ? 'minor' : ''}`}>
                          🎂 {ageInfo.age} yrs old ({ageInfo.category})
                        </span>
                      )}
                    </div>

                    <div className="birthday-selectors-grid">
                      <div className="select-wrapper">
                        <span className="select-label">MONTH</span>
                        <select
                          value={birthMonth}
                          onChange={(e) => handleDateSegmentChange('month', e.target.value)}
                          onBlur={handleBlur}
                          name="birthday"
                          className={
                            touched.birthday && errors.birthday
                              ? 'form-select input-error'
                              : touched.birthday && !errors.birthday && formData.birthday
                              ? 'form-select input-valid'
                              : 'form-select'
                          }
                        >
                          <option value="">Month</option>
                          {MONTHS.map((m) => (
                            <option key={m.value} value={m.value}>
                              {m.label}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="select-wrapper">
                        <span className="select-label">DAY</span>
                        <select
                          value={birthDay}
                          onChange={(e) => handleDateSegmentChange('day', e.target.value)}
                          onBlur={handleBlur}
                          name="birthday"
                          className={
                            touched.birthday && errors.birthday
                              ? 'form-select input-error'
                              : touched.birthday && !errors.birthday && formData.birthday
                              ? 'form-select input-valid'
                              : 'form-select'
                          }
                        >
                          <option value="">Day</option>
                          {DAYS.map((d) => (
                            <option key={d} value={d}>
                              {parseInt(d, 10)}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="select-wrapper">
                        <span className="select-label">YEAR</span>
                        <select
                          value={birthYear}
                          onChange={(e) => handleDateSegmentChange('year', e.target.value)}
                          onBlur={handleBlur}
                          name="birthday"
                          className={
                            touched.birthday && errors.birthday
                              ? 'form-select input-error'
                              : touched.birthday && !errors.birthday && formData.birthday
                              ? 'form-select input-valid'
                              : 'form-select'
                          }
                        >
                          <option value="">Year</option>
                          {YEARS.map((y) => (
                            <option key={y} value={y}>
                              {y}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="select-wrapper date-picker-alt" style={{ marginTop: '0.75rem' }}>
                      <span className="select-label">OR USE CALENDAR</span>
                      <input
                        type="date"
                        name="birthday"
                        value={formData.birthday || ''}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        className="calendar-direct-input"
                      />
                    </div>

                    {touched.birthday && errors.birthday && (
                      <span className="field-error">{errors.birthday}</span>
                    )}
                  </div>
                </div>

                {/* Bento Card 4: Contact & Location */}
                <div className="bento-card span-2">
                  <div className="bento-card-header">
                    <div className="icon-badge"><MapPin size={18} /></div>
                    <span>4. Contact & Address</span>
                  </div>

                  <div className="name-fields-grid" style={{ gridTemplateColumns: '1fr 2fr' }}>
                    <div className="input-group">
                      <label>
                        Contact Number{' '}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.82em' }}>
                          (optional)
                        </span>
                      </label>
                      <input
                        name="contact"
                        value={formData.contact || ''}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="e.g. 09XX-XXX-XXXX"
                        maxLength={30}
                        className={touched.contact && errors.contact ? 'input-error' : ''}
                      />
                      {touched.contact && errors.contact && (
                        <span className="field-error">{errors.contact}</span>
                      )}
                    </div>

                    <div className="input-group">
                      <label>
                        Address{' '}
                        <span style={{ fontWeight: 400, color: 'var(--text-muted)', fontSize: '0.82em' }}>
                          (optional)
                        </span>
                      </label>
                      <input
                        name="address"
                        value={formData.address || ''}
                        onChange={handleInputChange}
                        onBlur={handleBlur}
                        placeholder="Barangay, City, Province"
                        maxLength={200}
                        className={touched.address && errors.address ? 'input-error' : ''}
                      />
                      {touched.address && errors.address && (
                        <span className="field-error">{errors.address}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="form-actions-minimal">
                <button
                  type="submit"
                  className="btn btn-primary btn-large"
                  disabled={(!isValid && Object.keys(touched).length > 0) || !!duplicateMember}
                >
                  <Check size={20} />
                  {initialData ? 'Update Record' : 'Register Member'}
                </button>

                {!isValid && Object.keys(touched).length > 0 && (
                  <span className="form-error-hint">Please fill in all required fields above.</span>
                )}
                {duplicateMember && (
                  <span className="form-error-hint">Cannot save — duplicate PWD ID detected.</span>
                )}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default RegistrationForm;

