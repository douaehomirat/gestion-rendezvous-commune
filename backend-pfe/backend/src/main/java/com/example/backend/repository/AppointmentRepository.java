package com.example.backend.repository;

import com.example.backend.dto.ServiceCountDTO;
import com.example.backend.entity.Appointment;
import com.example.backend.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Map;

@Repository
public interface AppointmentRepository extends JpaRepository<Appointment, Long> {

    @Query("""
        SELECT a FROM Appointment a
        LEFT JOIN FETCH a.agent
        LEFT JOIN FETCH a.citizen
        LEFT JOIN FETCH a.department
        WHERE a.citizen.id = :id
    """)
    List<Appointment> findFullByCitizenId(@Param("id") Long id);

    List<Appointment> findByCitizen_Id(Long id);
    List<Appointment> findByAgent_Id(Long agentId);

    boolean existsByAgent_IdAndStartDateTime(Long agentId, LocalDateTime startDateTime);

    List<Appointment> findByDepartment_IdAndStartDateTimeBetween(
            Long departmentId,
            LocalDateTime start,
            LocalDateTime end
    );

    // ✅ CORRIGÉ : on exclut les rendez-vous annulés du conflit
    @Query("""
        SELECT CASE WHEN COUNT(a) > 0 THEN true ELSE false END
        FROM Appointment a
        WHERE a.agent.id = :agentId
        AND a.status != 'cancelled'
        AND (
            a.startDateTime < :end
            AND a.endDateTime > :start
        )
    """)
    boolean existsConflict(
            @Param("agentId") Long agentId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

    @Query("""
    SELECT COUNT(a)
    FROM Appointment a
    WHERE a.agent.id = :agentId
    AND a.startDateTime >= :startOfDay
    AND a.startDateTime < :endOfDay
    AND a.status != 'cancelled'
""")
    int countByAgentIdAndDay(
            @Param("agentId") Long agentId,
            @Param("startOfDay") LocalDateTime startOfDay,
            @Param("endOfDay") LocalDateTime endOfDay
    );

    @Query("""
        SELECT a.agent.id, COUNT(a)
        FROM Appointment a
        WHERE a.department.id = :deptId
        GROUP BY a.agent.id
        ORDER BY COUNT(a) ASC
    """)
    List<Object[]> findAgentLoad(@Param("deptId") Long deptId);

    List<Appointment> findByDateAndStatus(LocalDate now, String status);

    List<Appointment> findByDateAndAgent(LocalDate now, User agent);


    @Query("SELECT a FROM Appointment a WHERE a.agent.id = :agentId ORDER BY a.startDateTime DESC")
    List<Appointment> findAllByAgentId(@Param("agentId") Long agentId);


@Query("""
SELECT a FROM Appointment a
WHERE a.reminderSent = false
And AND a.status <> 'completed'
AND FUNCTION('TIMESTAMP', a.date, a.time) BETWEEN :now AND :limitDate
""")
List<Appointment> findAppointmentsForReminder(
        @Param("now") LocalDateTime now,
        @Param("limitDate") LocalDateTime limitDate
);


    @Query("SELECT a FROM Appointment a WHERE a.status = 'pending' AND a.createdAt <= :limit")
    List<Appointment> findExpiredAppointments(@Param("limit") LocalDateTime limit);


    @Query("""
    SELECT COUNT(a) > 0
    FROM Appointment a
    WHERE a.citizen.id = :citizenId
      AND a.department.id = :departmentId
      AND LOWER(a.status) <> 'cancelled'
      AND a.startDateTime >= :startOfWeek
      AND a.startDateTime <= :endOfWeek
""")
    boolean existsActiveAppointmentThisWeekForDepartment(
            @Param("citizenId") Long citizenId,
            @Param("departmentId") Long departmentId,
            @Param("startOfWeek") LocalDateTime startOfWeek,
            @Param("endOfWeek") LocalDateTime endOfWeek
    );

    List<Appointment> findByAgentIdAndStartDateTimeBetween(Long agentId, LocalDateTime startOfDay, LocalDateTime endOfDay);

    List<Appointment> findTop5ByOrderByDateDesc();





    @Query("SELECT COUNT(a) FROM Appointment a WHERE DATE(a.startDateTime) = CURRENT_DATE")
    long countTodayAppointments();

    @Query("""
    SELECT new com.example.backend.dto.ServiceCountDTO(
        a.department.name,
        COUNT(a)
    )
    FROM Appointment a
    WHERE a.department IS NOT NULL
    GROUP BY a.department.name
""")
    List<ServiceCountDTO> countByService();





    @Query("SELECT a.department.name, COUNT(a) FROM Appointment a GROUP BY a.department.name")
    List<Object[]> count_ByService();
    @Query("SELECT a.status, COUNT(a) FROM Appointment a GROUP BY a.status")
    List<Object[]> countByStatus();
    @Query("""
SELECT FUNCTION('MONTH', a.startDateTime), COUNT(a)
FROM Appointment a
GROUP BY FUNCTION('MONTH', a.startDateTime)
ORDER BY FUNCTION('MONTH', a.startDateTime)
""")
    List<Object[]> countByMonth();




    @Query("SELECT COUNT(a) FROM Appointment a")
    int countAll();

    // ✅ COUNT BY STATUS
    @Query("SELECT COUNT(a) FROM Appointment a WHERE a.status = :status")
    int countByStatus(String status);


    @Query("""
    SELECT COUNT(a)
    FROM Appointment a
    WHERE a.agent.id = :agentId
    AND a.startDateTime >= :startOfWeek
    AND a.startDateTime <= :endOfWeek
    AND a.status != 'cancelled'
""")
    int countAppointmentsByAgentAndPeriod(
            @Param("agentId") Long agentId,
            @Param("startOfWeek") LocalDateTime startOfWeek,
            @Param("endOfWeek") LocalDateTime endOfWeek
    );

    Appointment findAppointementByid(Long id);


    @Query("""
    SELECT a
    FROM Appointment a
    WHERE a.citizen.id = :citizenId
    AND a.status <> 'COMPLETED'
    AND a.status <> 'CANCELLED'
    ORDER BY a.date ASC, a.time ASC
""")
    List<Appointment> findUpcomingtByCitizen(
            @Param("citizenId") Long citizenId
    );

    @Query("""
    SELECT a FROM Appointment a
    WHERE a.citizen.id = :citizenId
    AND a.status NOT IN ('CANCELLED', 'COMPLETED')
    AND (
        a.date > CURRENT_DATE
        OR (
            a.date = CURRENT_DATE
            AND a.status IN ('IN_PROGRESS', 'CONFIRMED', 'PENDING')
        )
    )
    ORDER BY a.startDateTime ASC
""")
    List<Appointment> findUpcomingByCitizen(@Param("citizenId") Long citizenId);


    // Garder cette query existante (déjà correcte)
    @Query("""
    SELECT a FROM Appointment a
    WHERE a.date = :date
    AND a.agent.id = :agentId
    ORDER BY a.startDateTime ASC
""")
    List<Appointment> findByDateAndAgentOrderByTimeAsc(
            @Param("date") LocalDate date,
            @Param("agentId") Long agentId
    );


    @Query("""
    SELECT a FROM Appointment a
    WHERE a.citizen.id = :citizenId
      AND a.startDateTime >= :start
      AND a.startDateTime <= :end
""")
    List<Appointment> findByCitizenIdAndDateRange(
            @Param("citizenId") Long citizenId,
            @Param("start") LocalDateTime start,
            @Param("end") LocalDateTime end
    );

}
