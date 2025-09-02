import {
  ChatInputCommandInteraction,
  StringSelectMenuInteraction,
  ButtonInteraction,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder
} from 'discord.js';

// NOTE: All functions are written as pure helpers. They do NOT use `this`.
// You must pass any class-bound helpers (like DB insert or editOrReply) as callbacks.

// -------------------------
// Validation + DB insert helper
// -------------------------
export async function createEventWithValidatedInputs(
  interaction: ChatInputCommandInteraction | any,
  name: string,
  dateStr: string | null,
  timeStr: string | null,
  insertEventToDb: (payload: any) => Promise<{ data?: any; error?: any }>,
  editOrReply: (interaction: any, content: string, ephemeral?: boolean) => Promise<any>
) {
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;

  if (dateStr && !dateRegex.test(dateStr)) return editOrReply(interaction, '❌ `date` must be in YYYY-MM-DD format.');
  if (timeStr && !timeRegex.test(timeStr)) return editOrReply(interaction, '❌ `time` must be in HH:mm (24-hour) format.');
  if (timeStr && !dateStr) return editOrReply(interaction, '❌ If you provide `time`, you must also provide `date`.');

  // Future-ness checks
  if (dateStr || timeStr) {
    if (timeStr && dateStr) {
      if (!isFutureDateTime(dateStr, timeStr)) return editOrReply(interaction, '❌ Event datetime must be in the future.');
    } else if (dateStr && !timeStr) {
      const now = new Date();
      const eventDateOnly = new Date(`${dateStr}T00:00:00`);
      const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      if (isNaN(eventDateOnly.getTime())) return editOrReply(interaction, '❌ Invalid date.');
      if (eventDateOnly.getTime() <= todayStart.getTime()) return editOrReply(interaction, '❌ Event date must be after today.');
    }
  }

  // Insert to DB
  try {
    const payload = {
      event_name: name,
      event_date: dateStr,
      event_time: timeStr,
      host_discord_id: interaction.user?.id ?? (interaction.user ? interaction.user.id : 'unknown'),
      guild_id: interaction.guildId ?? (interaction.guild ? interaction.guild.id : null),
      status: 'active'
    };

    const { data, error } = await insertEventToDb(payload);
    if (error) throw error;

    const inserted = data ?? {};
    if (interaction.deferred || interaction.replied) {
      try { await interaction.editReply({ content: `✅ Event "${inserted.event_name ?? name}" created successfully!`, components: [] }); } catch {}
    } else {
      await editOrReply(interaction, `✅ Event "${inserted.event_name ?? name}" created successfully!`, true);
    }
    return { data: inserted };
  } catch (err) {
    console.error('❌ Error creating event:', err);
    return editOrReply(interaction, '❌ Error creating event. Please try again.');
  }
}

// -------------------------
// Time validation helpers
// -------------------------
export function isFutureDateTime(dateISO: string, time: string) {
  const dt = new Date(`${dateISO}T${time}:00`);
  if (isNaN(dt.getTime())) return false;
  return dt.getTime() > Date.now();
}

export function validateFutureFromPicker(dateISO: string, timeStr: string | null) {
  if (timeStr) return isFutureDateTime(dateISO, timeStr);
  const now = new Date();
  const eventDateOnly = new Date(`${dateISO}T00:00:00`);
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (isNaN(eventDateOnly.getTime())) return false;
  return eventDateOnly.getTime() > todayStart.getTime();
}

// -------------------------
// Calendar UI helpers (stateless)
// -------------------------
export async function showDatePicker(interaction: ChatInputCommandInteraction, eventName: string) {
  const session = Date.now().toString();
  const now = new Date();

  const yearOptions = [
    { label: `${now.getFullYear()}`, value: `${now.getFullYear()}` },
    { label: `${now.getFullYear() + 1}`, value: `${now.getFullYear() + 1}` }
  ];

  const yearMenu = new StringSelectMenuBuilder()
    .setCustomId(`cal_year::${session}::${encodeURIComponent(eventName)}`)
    .setPlaceholder('Pick a year')
    .addOptions(yearOptions);

  const cancelBtn = new ButtonBuilder().setCustomId(`cal_cancel::${session}`).setLabel('Cancel').setStyle(ButtonStyle.Danger);

  const rows = [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(yearMenu),
    new ActionRowBuilder<ButtonBuilder>().addComponents(cancelBtn)
  ];

  await interaction.reply({ ephemeral: true, content: `📅 Pick a year for **${eventName}**`, components: rows });
}

export async function showMonthPicker(interaction: StringSelectMenuInteraction, session: string, eventName: string, year: number) {
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: new Date(0, i).toLocaleString(undefined, { month: 'long' }),
    value: String(i + 1).padStart(2, '0')
  }));

  const monthMenu = new StringSelectMenuBuilder()
    .setCustomId(`cal_month::${session}::${encodeURIComponent(eventName)}::${year}`)
    .setPlaceholder('Pick a month')
    .addOptions(monthOptions);

  const backBtn = new ButtonBuilder().setCustomId(`cal_back_to_year::${session}::${encodeURIComponent(eventName)}`).setLabel('Back').setStyle(ButtonStyle.Secondary);
  const cancelBtn = new ButtonBuilder().setCustomId(`cal_cancel::${session}`).setLabel('Cancel').setStyle(ButtonStyle.Danger);

  const rows = [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(monthMenu),
    new ActionRowBuilder<ButtonBuilder>().addComponents(backBtn, cancelBtn)
  ];

  await interaction.update({ content: `📅 ${eventName} — Pick a month in ${year}`, components: rows });
}

export async function showDayPicker(interaction: StringSelectMenuInteraction | ButtonInteraction, session: string, eventName: string, year: number, month: number, page = 0) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const allDays = Array.from({ length: daysInMonth }, (_, i) => {
    const d = String(i + 1).padStart(2, '0');
    const iso = `${year}-${String(month).padStart(2,'0')}-${d}`;
    return { label: d, value: iso };
  });

  const pageSize = 25;
  const start = page * pageSize;
  const slice = allDays.slice(start, start + pageSize);

  const dayMenu = new StringSelectMenuBuilder()
    .setCustomId(`cal_day::${session}::${encodeURIComponent(eventName)}::${year}-${String(month).padStart(2,'0')}::page${page}`)
    .setPlaceholder('Pick a day')
    .addOptions(slice.map(d => ({ label: d.label, value: d.value })));

  const buttons: ButtonBuilder[] = [];
  if (start + pageSize < allDays.length) {
    buttons.push(new ButtonBuilder().setCustomId(`cal_next::${session}::${encodeURIComponent(eventName)}::${year}-${String(month).padStart(2,'0')}::${page+1}`).setLabel('Next').setStyle(ButtonStyle.Primary));
  }
  if (page > 0) {
    buttons.push(new ButtonBuilder().setCustomId(`cal_prev::${session}::${encodeURIComponent(eventName)}::${year}-${String(month).padStart(2,'0')}::${page-1}`).setLabel('Prev').setStyle(ButtonStyle.Secondary));
  }
  buttons.push(new ButtonBuilder().setCustomId(`cal_cancel::${session}`).setLabel('Cancel').setStyle(ButtonStyle.Danger));

  const rows = [
    new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dayMenu),
    new ActionRowBuilder<ButtonBuilder>().addComponents(...buttons)
  ];

  if ((interaction as any).isStringSelectMenu && (interaction as any).isStringSelectMenu()) {
    await (interaction as StringSelectMenuInteraction).update({ content: `📅 ${eventName} — Pick a day (page ${page+1})`, components: rows });
  } else {
    await (interaction as ButtonInteraction).update({ content: `📅 ${eventName} — Pick a day (page ${page+1})`, components: rows });
  }
}

export async function showTimePicker(interaction: StringSelectMenuInteraction, session: string, eventName: string, dateISO: string) {
  const times = [ 'No time', '09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '18:00', '20:00' ];
  const opts = times.map(t => ({ label: t, value: t === 'No time' ? `${dateISO}::NOTIME` : `${dateISO}T${t}` }));

  const menu = new StringSelectMenuBuilder()
    .setCustomId(`cal_time::${session}::${encodeURIComponent(eventName)}::${dateISO}`)
    .setPlaceholder('Pick a time (optional)')
    .addOptions(opts.slice(0, 25));

  const rows = [ new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu), new ActionRowBuilder<ButtonBuilder>().addComponents(new ButtonBuilder().setCustomId(`cal_cancel::${session}`).setLabel('Cancel').setStyle(ButtonStyle.Danger)) ];

  await interaction.update({ content: `⏰ ${eventName} — pick a time (optional) for ${dateISO}`, components: rows });
}

// -------------------------
// Interaction handlers (stateless): require callbacks for insert/edit
// -------------------------
export async function handleCalendarSelect(
  interaction: StringSelectMenuInteraction,
  callbacks: {
    createEvent: (interaction: any, name: string, date: string | null, time: string | null) => Promise<any>;
    showMonthPicker: typeof showMonthPicker;
    showDayPicker: typeof showDayPicker;
    showTimePicker: typeof showTimePicker;
    validateFutureFromPicker: typeof validateFutureFromPicker;
  }
) {
  const [prefix, session, encodedName, extra] = interaction.customId.split('::');
  const name = decodeURIComponent(encodedName || '');

  try {
    if (prefix === 'cal_year') {
      await interaction.deferUpdate();
      const year = Number(interaction.values[0]);
      return callbacks.showMonthPicker(interaction, session, name, year);
    }

    if (prefix === 'cal_month') {
      await interaction.deferUpdate();
      const year = Number(extra);
      const month = Number(interaction.values[0]);
      return callbacks.showDayPicker(interaction, session, name, year, month, 0);
    }

    if (prefix === 'cal_day') {
      await interaction.deferUpdate();
      const dateISO = interaction.values[0];
      return callbacks.showTimePicker(interaction, session, name, dateISO);
    }

    if (prefix === 'cal_time') {
      await interaction.deferUpdate();
      const raw = interaction.values[0];
      let datePart: string, timePart: string | null;
      if (raw.includes('::NOTIME')) {
        [datePart] = raw.split('::');
        timePart = null;
      } else {
        const [dateIso, time] = raw.split('T');
        datePart = dateIso;
        timePart = time;
      }

      if (!callbacks.validateFutureFromPicker(datePart, timePart)) {
        return interaction.followUp({ ephemeral: true, content: '❌ Selected datetime is in the past. Pick another.' });
      }

      return callbacks.createEvent(interaction, name, datePart, timePart);
    }
  } catch (err) {
    console.error('calendar-select failed', err);
    try { await interaction.followUp({ ephemeral: true, content: '❌ Something went wrong.' }); } catch (e) {}
  }
}

export async function handleCalendarButton(
  interaction: ButtonInteraction,
  callbacks: {
    showDatePicker: typeof showDatePicker;
    showDayPicker: typeof showDayPicker;
  }
) {
  const parts = interaction.customId.split('::');
  const prefix = parts[0];
  try {
    if (prefix === 'cal_cancel') {
      await interaction.update({ content: 'Canceled.', components: [] });
      return;
    }
    if (prefix === 'cal_back_to_year') {
      await interaction.deferUpdate();
      const name = decodeURIComponent(parts[2] || '');
      return callbacks.showDatePicker(interaction as any, name);
    }

    if (prefix === 'cal_next' || prefix === 'cal_prev') {
      await interaction.deferUpdate();
      const name = decodeURIComponent(parts[2] || '');
      const ym = parts[3];
      const page = Number(parts[4] || '0');
      const [year, month] = ym.split('-').map(Number);
      return callbacks.showDayPicker(interaction, parts[1], name, year, month, page);
    }
  } catch (err) {
    console.error('calendar-button failed', err);
    try { await interaction.followUp({ ephemeral: true, content: '❌ Something went wrong.' }); } catch (e) {}
  }
}

export async function isDateInFuture(dateStr?: string | null, timeStr?: string | null): Promise<boolean> {
  if (!dateStr) return true; // no date provided → allow
  const now = new Date();

  const dateTime = timeStr
    ? new Date(`${dateStr}T${timeStr}`)
    : new Date(dateStr);

  return dateTime > now;
}

export async function replyWithCalendar(interaction: ChatInputCommandInteraction) {
  await interaction.reply({
    content: "📅 Please pick a date/time for your event (feature under development).",
    ephemeral: true
})}

