import GeoFence from "../models/GeoFenceModel.js";
import { calculateDistance } from "../utils/calculateDistance.js";

export const getActiveGeoFence = async (req, res) => {
  try {
    const geoFence = await GeoFence.findOne({
      where: { isActive: true },
    });

    if (!geoFence) {
      return res.status(404).json({ message: "Geofence belum diset" });
    }

    res.json(geoFence);
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const createGeoFence = async (req, res) => {
  try {
    const { name, latitude, longitude, radius } = req.body;

    if (!name || !latitude || !longitude) {
      return res.status(400).json({ message: "Data geofence tidak lengkap" });
    }

    // nonaktifkan geofence lama
    await GeoFence.update({ isActive: false }, { where: { isActive: true } });

    const geoFence = await GeoFence.create({
      name,
      latitude,
      longitude,
      radius: radius || 150,
      isActive: true,
    });

    res.status(201).json({
      message: "Geofence berhasil disimpan",
      data: geoFence,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const updateGeoFence = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, latitude, longitude, radius, isActive } = req.body;

    const geoFence = await GeoFence.findByPk(id);
    if (!geoFence) {
      return res.status(404).json({ message: "Geofence tidak ditemukan" });
    }

    await geoFence.update({
      name,
      latitude,
      longitude,
      radius,
      isActive,
    });

    res.json({
      message: "Geofence berhasil diupdate",
      data: geoFence,
    });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};

export const deleteGeoFence = async (req, res) => {
  try {
    const { id } = req.params;

    const geoFence = await GeoFence.findByPk(id);
    if (!geoFence) {
      return res.status(404).json({ message: "Geofence tidak ditemukan" });
    }

    await geoFence.destroy();

    res.json({ message: "Geofence berhasil dihapus" });
  } catch (error) {
    res.status(500).json({ message: "Server error" });
  }
};
