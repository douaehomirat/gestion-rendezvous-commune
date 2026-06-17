package com.example.backend.config;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class CloudinaryConfig {

    @Bean
    public Cloudinary cloudinary() {
        return new Cloudinary(ObjectUtils.asMap(
            "cloud_name", "deqjwkyux",
            "api_key", "962729596994882",
            "api_secret", "zPIxTAg8DQGyFQNJC9fzjpz-4ls"
        ));
    }
}