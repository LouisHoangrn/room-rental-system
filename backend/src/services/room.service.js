const { pool } = require("../config/db");

class RoomService {
  /**
   * Get all rooms with filtering and pagination (UC-03 — public)
   */
  async getRooms(filters = {}) {
    const {
      search,
      city,
      district,
      min_price,
      max_price,
      min_area,
      max_area,
      wifi,
      parking,
      air_conditioner,
      private_bathroom,
      kitchen,
      page = 1,
      limit = 12,
    } = filters;
    const offset = (page - 1) * limit;

    let whereClause = "WHERE r.status = 'AVAILABLE'";
    const params = [];

    if (search) {
      whereClause +=
        " AND (r.title LIKE ? OR r.description LIKE ? OR r.city LIKE ? OR r.district LIKE ?)";
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (city) {
      whereClause += " AND r.city = ?";
      params.push(city);
    }
    if (district) {
      whereClause += " AND r.district = ?";
      params.push(district);
    }
    if (min_price) {
      whereClause += " AND r.price >= ?";
      params.push(parseFloat(min_price));
    }
    if (max_price) {
      whereClause += " AND r.price <= ?";
      params.push(parseFloat(max_price));
    }
    if (min_area) {
      whereClause += " AND r.area >= ?";
      params.push(parseFloat(min_area));
    }
    if (max_area) {
      whereClause += " AND r.area <= ?";
      params.push(parseFloat(max_area));
    }

    // Amenity filters
    if (wifi === "true" || wifi === true) {
      whereClause += " AND a.wifi = TRUE";
    }
    if (parking === "true" || parking === true) {
      whereClause += " AND a.parking = TRUE";
    }
    if (air_conditioner === "true" || air_conditioner === true) {
      whereClause += " AND a.air_conditioner = TRUE";
    }
    if (private_bathroom === "true" || private_bathroom === true) {
      whereClause += " AND a.private_bathroom = TRUE";
    }
    if (kitchen === "true" || kitchen === true) {
      whereClause += " AND a.kitchen = TRUE";
    }

    // Get total count
    const [countResult] = await pool.query(
      `SELECT COUNT(*) as total FROM Rooms r
       LEFT JOIN RoomAmenities a ON r.id = a.room_id
       ${whereClause}`,
      params,
    );
    const total = countResult[0].total;

    // Get rooms with owner info and primary image (image_order = 0)
    const [rooms] = await pool.query(
      `SELECT r.*,
              u.name as owner_name,
              (SELECT image_url FROM RoomImages WHERE room_id = r.id AND image_order = 0 LIMIT 1) as primary_image,
              a.wifi, a.parking, a.air_conditioner, a.private_bathroom, a.kitchen
       FROM Rooms r
       JOIN Users u ON r.owner_id = u.id
       LEFT JOIN RoomAmenities a ON r.id = a.room_id
       ${whereClause}
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), parseInt(offset)],
    );

    return { rooms, total, page: parseInt(page), limit: parseInt(limit) };
  }

  /**
   * Get single room by ID (UC-03 — public)
   */
  async getRoomById(id) {
    const [rooms] = await pool.query(
      `SELECT r.*,
              u.name as owner_name, u.email as owner_email, u.phone as owner_phone
       FROM Rooms r
       JOIN Users u ON r.owner_id = u.id
       WHERE r.id = ?`,
      [id],
    );

    if (rooms.length === 0) {
      throw { statusCode: 404, message: "Không tìm thấy phòng trọ" };
    }

    const room = rooms[0];

    // Get images (sorted by image_order, 0 = primary)
    const [images] = await pool.query(
      "SELECT id, image_url, image_order FROM RoomImages WHERE room_id = ? ORDER BY image_order ASC",
      [id],
    );
    room.images = images;

    // Get amenities (1-1 relationship)
    const [amenities] = await pool.query(
      "SELECT wifi, parking, air_conditioner, private_bathroom, kitchen FROM RoomAmenities WHERE room_id = ?",
      [id],
    );
    room.amenities =
      amenities.length > 0
        ? amenities[0]
        : {
            wifi: false,
            parking: false,
            air_conditioner: false,
            private_bathroom: false,
            kitchen: false,
          };

    return room;
  }

  /**
   * Create a new room (UC-04 — Owner only)
   * Status defaults to PENDING, waits for Admin approval
   */
  async createRoom(ownerId, data) {
    const {
      title,
      description,
      price,
      area,
      city,
      district,
      street,
      wifi,
      parking,
      air_conditioner,
      private_bathroom,
      kitchen,
    } = data;

    const [result] = await pool.query(
      `INSERT INTO Rooms (owner_id, title, description, price, area, city, district, street, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [
        ownerId,
        title,
        description,
        price,
        area || null,
        city,
        district,
        street || null,
      ],
    );

    const roomId = result.insertId;

    // Create amenities record (1-1)
    await pool.query(
      `INSERT INTO RoomAmenities (room_id, wifi, parking, air_conditioner, private_bathroom, kitchen)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        roomId,
        wifi || false,
        parking || false,
        air_conditioner || false,
        private_bathroom || false,
        kitchen || false,
      ],
    );

    // Notify Admins about the new room pending approval
    try {
      const { notificationService } = require("./notification.service");
      const [admins] = await pool.query(
        "SELECT id FROM Users WHERE role = 'ADMIN'",
      );
      for (const admin of admins) {
        await notificationService.create({
          user_id: admin.id,
          type: "ROOM",
          content: `Có phòng trọ mới "${title}" đang chờ duyệt.`,
          reference_id: roomId,
          reference_type: "ROOM",
        });
      }
    } catch (e) {
      console.error("Error notifying admin of new room:", e);
    }

    return this.getRoomById(roomId);
  }

  /**
   * Update room (UC-04 — Owner only)
   */
  async updateRoom(roomId, ownerId, data) {
    // Verify ownership
    const [rooms] = await pool.query(
      "SELECT id FROM Rooms WHERE id = ? AND owner_id = ?",
      [roomId, ownerId],
    );
    if (rooms.length === 0) {
      throw {
        statusCode: 404,
        message: "Phòng không tồn tại hoặc bạn không có quyền",
      };
    }

    const {
      title,
      description,
      price,
      area,
      city,
      district,
      street,
      wifi,
      parking,
      air_conditioner,
      private_bathroom,
      kitchen,
    } = data;

    // Update Rooms table
    const updates = [];
    const values = [];
    const fields = { title, description, price, area, city, district, street };

    for (const [key, value] of Object.entries(fields)) {
      if (value !== undefined) {
        updates.push(`${key} = ?`);
        values.push(value);
      }
    }

    if (updates.length > 0) {
      values.push(roomId);
      await pool.query(
        `UPDATE Rooms SET ${updates.join(", ")} WHERE id = ?`,
        values,
      );
    }

    // Update amenities (1-1)
    const amenityFields = {
      wifi,
      parking,
      air_conditioner,
      private_bathroom,
      kitchen,
    };
    const amenityUpdates = [];
    const amenityValues = [];

    for (const [key, value] of Object.entries(amenityFields)) {
      if (value !== undefined) {
        amenityUpdates.push(`${key} = ?`);
        amenityValues.push(value);
      }
    }

    if (amenityUpdates.length > 0) {
      // Check if amenity record exists
      const [existing] = await pool.query(
        "SELECT id FROM RoomAmenities WHERE room_id = ?",
        [roomId],
      );
      if (existing.length === 0) {
        await pool.query(
          `INSERT INTO RoomAmenities (room_id, wifi, parking, air_conditioner, private_bathroom, kitchen)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [
            roomId,
            wifi || false,
            parking || false,
            air_conditioner || false,
            private_bathroom || false,
            kitchen || false,
          ],
        );
      } else {
        amenityValues.push(roomId);
        await pool.query(
          `UPDATE RoomAmenities SET ${amenityUpdates.join(", ")} WHERE room_id = ?`,
          amenityValues,
        );
      }
    }

    return this.getRoomById(roomId);
  }

  /**
   * Delete room (UC-04 — Owner only)
   */
  async deleteRoom(roomId, ownerId) {
    const [rooms] = await pool.query(
      "SELECT id FROM Rooms WHERE id = ? AND owner_id = ?",
      [roomId, ownerId],
    );
    if (rooms.length === 0) {
      throw {
        statusCode: 404,
        message: "Phòng không tồn tại hoặc bạn không có quyền",
      };
    }

    // CASCADE will handle RoomImages, RoomAmenities, etc.
    await pool.query("DELETE FROM Rooms WHERE id = ?", [roomId]);

    return { message: "Xóa phòng thành công" };
  }

  /**
   * Upload room images
   */
  async uploadImages(roomId, ownerId, files) {
    const [rooms] = await pool.query(
      "SELECT id FROM Rooms WHERE id = ? AND owner_id = ?",
      [roomId, ownerId],
    );
    if (rooms.length === 0) {
      throw {
        statusCode: 404,
        message: "Phòng không tồn tại hoặc bạn không có quyền",
      };
    }

    if (!files || files.length === 0) {
      throw { statusCode: 400, message: "Không có ảnh nào được tải lên" };
    }

    // Get current max image_order
    const [maxOrder] = await pool.query(
      "SELECT COALESCE(MAX(image_order), -1) as max_order FROM RoomImages WHERE room_id = ?",
      [roomId],
    );
    let nextOrder = maxOrder[0].max_order + 1;

    const imageValues = files.map((file, index) => [
      roomId,
      `/uploads/rooms/${file.filename}`,
      nextOrder + index,
    ]);

    await pool.query(
      "INSERT INTO RoomImages (room_id, image_url, image_order) VALUES ?",
      [imageValues],
    );

    const [images] = await pool.query(
      "SELECT * FROM RoomImages WHERE room_id = ? ORDER BY image_order ASC",
      [roomId],
    );
    return images;
  }

  /**
   * Delete a room image
   */
  async deleteImage(imageId, ownerId) {
    const [images] = await pool.query(
      `SELECT ri.* FROM RoomImages ri
       JOIN Rooms r ON ri.room_id = r.id
       WHERE ri.id = ? AND r.owner_id = ?`,
      [imageId, ownerId],
    );

    if (images.length === 0) {
      throw {
        statusCode: 404,
        message: "Ảnh không tồn tại hoặc bạn không có quyền",
      };
    }

    await pool.query("DELETE FROM RoomImages WHERE id = ?", [imageId]);
    return { message: "Xóa ảnh thành công" };
  }

  /**
   * Get owner's rooms (UC-04)
   */
  async getOwnerRooms(ownerId, page = 1, limit = 10) {
    const offset = (page - 1) * limit;

    const [countResult] = await pool.query(
      "SELECT COUNT(*) as total FROM Rooms WHERE owner_id = ?",
      [ownerId],
    );

    const [rooms] = await pool.query(
      `SELECT r.*,
              (SELECT image_url FROM RoomImages WHERE room_id = r.id AND image_order = 0 LIMIT 1) as primary_image,
              (SELECT COUNT(*) FROM RentalRequests WHERE room_id = r.id AND status = 'PENDING') as pending_requests,
              a.wifi, a.parking, a.air_conditioner, a.private_bathroom, a.kitchen
       FROM Rooms r
       LEFT JOIN RoomAmenities a ON r.id = a.room_id
       WHERE r.owner_id = ?
       ORDER BY r.created_at DESC
       LIMIT ? OFFSET ?`,
      [ownerId, parseInt(limit), parseInt(offset)],
    );

    return {
      rooms,
      total: countResult[0].total,
      page: parseInt(page),
      limit: parseInt(limit),
    };
  }

  /**
   * Get distinct cities for filter
   */
  async getCities() {
    const [cities] = await pool.query(
      "SELECT DISTINCT city FROM Rooms WHERE status = 'AVAILABLE' AND city IS NOT NULL ORDER BY city",
    );
    return cities.map((c) => c.city);
  }

  /**
   * Get distinct districts for a city
   */
  async getDistricts(city) {
    const [districts] = await pool.query(
      "SELECT DISTINCT district FROM Rooms WHERE status = 'AVAILABLE' AND city = ? AND district IS NOT NULL ORDER BY district",
      [city],
    );
    return districts.map((d) => d.district);
  }
}

module.exports = new RoomService();
