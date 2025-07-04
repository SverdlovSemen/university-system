package com.unidata.university_system.models

import javax.persistence.*

@Entity
@Table(name = "users")
class User(
        @Id
        @GeneratedValue(strategy = GenerationType.IDENTITY)
        val id: Long?,

        @Column(nullable = false, unique = true)
        val username: String,

        @Column(nullable = false)
        val password: String,

        @Column(nullable = false)
        val enabled: Boolean = true
)