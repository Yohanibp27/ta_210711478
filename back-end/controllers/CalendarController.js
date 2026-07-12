import CalendarDay from "../models/CalendarModel.js";
import { Op } from "sequelize";

// Get Semua Hari Libur (Bisa difilter berdasarkan tahun)
export const getCalendarDays = async (req, res) => {
  try {
    const { year } = req.query;
    let whereClause = {};
    if (year) {
      whereClause.date = {
        [Op.between]: [`${year}-01-01`, `${year}-12-31`],
      };
    }
    const response = await CalendarDay.findAll({
      where: whereClause,
      order: [["date", "ASC"]],
    });
    res
      .status(200)
      .json({ message: "Berhasil menampilkan data kalender", data: response });
  } catch (e) {
    res
      .status(500)
      .json({ message: "Gagal mengambil data kalender", error: e.message });
  }
};

export const createCalendarDay = async (req, res) => {
  const {
    name,
    date,
    isHoliday,
    holidayType,
    appliesTo,
    description,
    repeatYearly,
  } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: "Nama hari libur wajib diisi!" });
    }

    if (!date) {
      return res.status(400).json({ message: "Tanggal wajib diisi!" });
    }

    if (isNaN(new Date(date).getTime())) {
      return res.status(400).json({ message: "Format tanggal tidak valid!" });
    }

    const isHolidayBool = isHoliday === true || isHoliday === "true";
    const isRepeatBool = repeatYearly === true || repeatYearly === "true";

    if (isHolidayBool) {
      if (!holidayType) {
        return res.status(400).json({
          message:
            "Jika diset sebagai hari libur, 'holidayType' wajib dipilih!",
        });
      }
      if (!appliesTo) {
        return res.status(400).json({
          message: "Jika diset sebagai hari libur, 'appliesTo' wajib dipilih!",
        });
      }
    }

    const existing = await CalendarDay.findOne({ where: { date } });
    if (existing)
      return res
        .status(400)
        .json({ message: "Tanggal ini sudah terdaftar di kalender!" });

    const response = await CalendarDay.create({
      name,
      date,
      isHoliday: isHolidayBool,
      holidayType: isHolidayBool ? holidayType : null,
      appliesTo: isHolidayBool ? appliesTo : null,
      description,
      repeatYearly: isRepeatBool,
    });
    res
      .status(201)
      .json({ message: "Hari libur berhasil ditambahkan!", data: response });
  } catch (e) {
    res
      .status(400)
      .json({ message: "Gagal menambahkan data kalender!", error: e.messae });
  }
};

export const updateCalendarDay = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    date,
    isHoliday,
    holidayType,
    appliesTo,
    description,
    repeatYearly,
  } = req.body;

  try {
    const calendarDay = await CalendarDay.findByPk(id);
    if (!calendarDay) {
      return res
        .status(404)
        .json({ message: "Data kalender tidak ditemukan!" });
    }
    if (date) {
      if (isNaN(new Date(date).getTime())) {
        return res.status(400).json({ message: "Format tanggal tidak valid!" });
      }
      const existing = await CalendarDay.findOne({
        where: {
          date: date,
          id: { [Op.ne]: id }, // Not Equal to current ID
        },
      });
      if (existing) {
        return res
          .status(400)
          .json({ message: "Tanggal ini sudah digunakan oleh data lain!" });
      }
    }

    // const isHolidayBool = isHoliday === true || isHoliday === "true";
    const isHolidayBool =
      isHoliday !== undefined
        ? isHoliday === true || isHoliday === "true"
        : calendarDay.isHoliday;
    const isRepeatBool =
      repeatYearly !== undefined
        ? repeatYearly === true || repeatYearly === "true"
        : calendarDay.repeatYearly;

    if (isHolidayBool) {
      if (!holidayType && !calendarDay.holidayType) {
        return res.status(400).json({
          message: "Jika diset sebagai hari libur, 'holidayType' wajib diisi!",
        });
      }
      if (!appliesTo && !calendarDay.appliesTo) {
        return res.status(400).json({
          message: "Jika diset sebagai hari libur, 'appliesTo' wajib diisi!",
        });
      }
    }

    await CalendarDay.update(
      {
        name: name || calendarDay.name,
        date: date || calendarDay.date,
        isHoliday: isHolidayBool,
        holidayType: isHolidayBool
          ? holidayType || calendarDay.holidayType
          : null,
        appliesTo: isHolidayBool ? appliesTo || calendarDay.appliesTo : null,
        description:
          description !== undefined ? description : calendarDay.description,
        repeatYearly: isRepeatBool,
      },
      {
        where: { id: id },
      },
    );
    const updatedData = await CalendarDay.findByPk(id);

    res.status(200).json({
      message: "Hari libur berhasil diperbarui!",
      data: updatedData,
    });
  } catch (e) {
    res.status(500).json({
      message: "Gagal memperbarui data kalender!",
      error: e.message,
    });
  }
};

export const deleteCalendarDay = async (req, res) => {
  try {
    await CalendarDay.destroy({ where: { id: req.params.id } });
    res.status(200).json({ message: "Hari libur berhasil dihapus" });
  } catch (e) {
    res
      .status(400)
      .json({ message: "Gagal menghapus data kalender", error: e.message });
  }
};
