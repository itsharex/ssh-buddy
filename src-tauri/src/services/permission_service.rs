use crate::models::{SshBuddyError, SshResult};
use serde::{Deserialize, Serialize};
use std::path::Path;

#[cfg(unix)]
use std::os::unix::fs::PermissionsExt;

/// Permission check result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionCheckResult {
    pub is_valid: bool,
    pub current_mode: Option<String>,
    pub expected_mode: String,
    pub message: String,
}

/// Permission fix result
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PermissionFixResult {
    pub success: bool,
    pub message: String,
    pub new_mode: Option<String>,
}

/// Permission service
pub struct PermissionService;

impl PermissionService {
    /// Check key file permissions
    #[cfg(unix)]
    pub async fn check_key_permissions(key_path: &str) -> SshResult<PermissionCheckResult> {
        let path = Path::new(key_path);

        if !path.exists() {
            return Err(SshBuddyError::KeyNotFound {
                path: key_path.to_string(),
            });
        }

        let metadata = std::fs::metadata(path).map_err(|e| SshBuddyError::IoError {
            message: format!("Failed to read file metadata: {}", e),
        })?;

        let mode = metadata.permissions().mode();
        let file_mode = mode & 0o777; // Only get file permission bits
        let mode_str = format!("{:03o}", file_mode);

        // Private key should be 600 (rw-------)
        let is_valid = file_mode == 0o600;
        let expected_mode = "600".to_string();

        Ok(PermissionCheckResult {
            is_valid,
            current_mode: Some(mode_str.clone()),
            expected_mode,
            message: if is_valid {
                "Key permissions are correct".to_string()
            } else {
                format!(
                    "Key permissions are {} but should be 600. File is too accessible.",
                    mode_str
                )
            },
        })
    }

    #[cfg(windows)]
    pub async fn check_key_permissions(key_path: &str) -> SshResult<PermissionCheckResult> {
        let path = Path::new(key_path);

        if !path.exists() {
            return Err(SshBuddyError::KeyNotFound {
                path: key_path.to_string(),
            });
        }

        // Windows: Use icacls to check permissions
        // A properly secured key should only have the current user with access
        let output = std::process::Command::new("icacls")
            .arg(key_path)
            .output()
            .map_err(|e| SshBuddyError::IoError {
                message: format!("Failed to run icacls: {}", e),
            })?;

        if !output.status.success() {
            return Ok(PermissionCheckResult {
                is_valid: false,
                current_mode: None,
                expected_mode: "User only".to_string(),
                message: "Failed to check file permissions".to_string(),
            });
        }

        let stdout = String::from_utf8_lossy(&output.stdout);
        let current_user = whoami::username();

        // Check if only the current user has access
        // icacls output format: path user:(permissions)
        let lines: Vec<&str> = stdout.lines().collect();
        let mut has_other_users = false;
        let mut user_has_access = false;

        for line in &lines {
            let line_lower = line.to_lowercase();
            // Skip the path line and empty lines
            if line.contains(key_path) || line.trim().is_empty() {
                continue;
            }

            // Check if current user has access
            if line_lower.contains(&current_user.to_lowercase()) {
                user_has_access = true;
            } else if line.contains("BUILTIN\\Administrators")
                || line.contains("NT AUTHORITY\\SYSTEM")
            {
                // These are system accounts, usually acceptable
                continue;
            } else if line.contains(":") && !line.trim().starts_with("Successfully") {
                // Another user/group has access
                has_other_users = true;
            }
        }

        let is_valid = user_has_access && !has_other_users;

        Ok(PermissionCheckResult {
            is_valid,
            current_mode: Some("ACL".to_string()),
            expected_mode: "User only".to_string(),
            message: if is_valid {
                "Key permissions are correct (restricted to current user)".to_string()
            } else if has_other_users {
                "Key file is accessible by other users. Consider restricting permissions."
                    .to_string()
            } else {
                "Unable to verify key permissions".to_string()
            },
        })
    }

    /// Fix key file permissions
    #[cfg(unix)]
    pub async fn fix_key_permissions(key_path: &str) -> SshResult<PermissionFixResult> {
        let path = Path::new(key_path);

        if !path.exists() {
            return Err(SshBuddyError::KeyNotFound {
                path: key_path.to_string(),
            });
        }

        // Set permissions to 600
        let permissions = std::fs::Permissions::from_mode(0o600);
        std::fs::set_permissions(path, permissions).map_err(|e| SshBuddyError::IoError {
            message: format!("Failed to set permissions: {}", e),
        })?;

        // Verify new permissions
        let metadata = std::fs::metadata(path).map_err(|e| SshBuddyError::IoError {
            message: format!("Failed to verify permissions: {}", e),
        })?;

        let new_mode = metadata.permissions().mode() & 0o777;
        let mode_str = format!("{:03o}", new_mode);

        Ok(PermissionFixResult {
            success: new_mode == 0o600,
            message: format!("Permissions set to {}", mode_str),
            new_mode: Some(mode_str),
        })
    }

    #[cfg(windows)]
    pub async fn fix_key_permissions(key_path: &str) -> SshResult<PermissionFixResult> {
        let path = Path::new(key_path);

        if !path.exists() {
            return Err(SshBuddyError::KeyNotFound {
                path: key_path.to_string(),
            });
        }

        let current_user = whoami::username();

        // Windows requires icacls or PowerShell to set ACL
        // Use icacls command to restrict permissions
        let output = std::process::Command::new("icacls")
            .args([
                key_path,
                "/inheritance:r", // Remove inheritance
                "/grant:r",
                &format!("{}:F", current_user), // Only give current user full control
            ])
            .output()
            .map_err(|e| SshBuddyError::IoError {
                message: format!("Failed to run icacls: {}", e),
            })?;

        if output.status.success() {
            log::info!(
                "[permission_service] Windows: Fixed key permissions for {}",
                key_path
            );
            Ok(PermissionFixResult {
                success: true,
                message: format!(
                    "Permissions restricted to current user ({}) only",
                    current_user
                ),
                new_mode: Some("User only".to_string()),
            })
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            log::warn!(
                "[permission_service] Windows: Failed to fix key permissions: {}",
                stderr
            );
            Ok(PermissionFixResult {
                success: false,
                message: format!("Failed to set permissions: {}", stderr),
                new_mode: None,
            })
        }
    }

    /// Check SSH directory permissions
    #[cfg(unix)]
    pub async fn check_ssh_dir_permissions() -> SshResult<PermissionCheckResult> {
        let ssh_dir = dirs::home_dir()
            .ok_or(SshBuddyError::HomeDirNotFound)?
            .join(".ssh");

        if !ssh_dir.exists() {
            return Ok(PermissionCheckResult {
                is_valid: false,
                current_mode: None,
                expected_mode: "700".to_string(),
                message: "SSH directory does not exist".to_string(),
            });
        }

        let metadata = std::fs::metadata(&ssh_dir).map_err(|e| SshBuddyError::IoError {
            message: format!("Failed to read directory metadata: {}", e),
        })?;

        let mode = metadata.permissions().mode();
        let dir_mode = mode & 0o777;
        let mode_str = format!("{:03o}", dir_mode);

        // .ssh directory should be 700 (rwx------)
        let is_valid = dir_mode == 0o700;

        Ok(PermissionCheckResult {
            is_valid,
            current_mode: Some(mode_str.clone()),
            expected_mode: "700".to_string(),
            message: if is_valid {
                "SSH directory permissions are correct".to_string()
            } else {
                format!(
                    "SSH directory permissions are {} but should be 700",
                    mode_str
                )
            },
        })
    }

    #[cfg(windows)]
    pub async fn check_ssh_dir_permissions() -> SshResult<PermissionCheckResult> {
        let ssh_dir = dirs::home_dir()
            .ok_or(SshBuddyError::HomeDirNotFound)?
            .join(".ssh");

        if !ssh_dir.exists() {
            return Ok(PermissionCheckResult {
                is_valid: false,
                current_mode: None,
                expected_mode: "User only".to_string(),
                message: "SSH directory does not exist".to_string(),
            });
        }

        let ssh_dir_str = ssh_dir.to_string_lossy();

        // Windows: Use icacls to check directory permissions
        let output = std::process::Command::new("icacls")
            .arg(ssh_dir_str.as_ref())
            .output()
            .map_err(|e| SshBuddyError::IoError {
                message: format!("Failed to run icacls: {}", e),
            })?;

        if !output.status.success() {
            return Ok(PermissionCheckResult {
                is_valid: false,
                current_mode: None,
                expected_mode: "User only".to_string(),
                message: "Failed to check directory permissions".to_string(),
            });
        }

        // For Windows, we consider the directory permissions valid if it exists
        // More detailed ACL checking could be added if needed
        Ok(PermissionCheckResult {
            is_valid: true,
            current_mode: Some("ACL".to_string()),
            expected_mode: "User only".to_string(),
            message: "SSH directory exists with Windows ACL permissions".to_string(),
        })
    }

    /// Fix SSH directory permissions
    #[cfg(unix)]
    pub async fn fix_ssh_dir_permissions() -> SshResult<PermissionFixResult> {
        let ssh_dir = dirs::home_dir()
            .ok_or(SshBuddyError::HomeDirNotFound)?
            .join(".ssh");

        if !ssh_dir.exists() {
            // Create directory
            std::fs::create_dir_all(&ssh_dir).map_err(|e| SshBuddyError::IoError {
                message: format!("Failed to create SSH directory: {}", e),
            })?;
        }

        // Set permissions to 700
        let permissions = std::fs::Permissions::from_mode(0o700);
        std::fs::set_permissions(&ssh_dir, permissions).map_err(|e| SshBuddyError::IoError {
            message: format!("Failed to set directory permissions: {}", e),
        })?;

        Ok(PermissionFixResult {
            success: true,
            message: "SSH directory permissions set to 700".to_string(),
            new_mode: Some("700".to_string()),
        })
    }

    #[cfg(windows)]
    pub async fn fix_ssh_dir_permissions() -> SshResult<PermissionFixResult> {
        let ssh_dir = dirs::home_dir()
            .ok_or(SshBuddyError::HomeDirNotFound)?
            .join(".ssh");

        // Create directory if it doesn't exist
        if !ssh_dir.exists() {
            std::fs::create_dir_all(&ssh_dir).map_err(|e| SshBuddyError::IoError {
                message: format!("Failed to create SSH directory: {}", e),
            })?;
        }

        let ssh_dir_str = ssh_dir.to_string_lossy();
        let current_user = whoami::username();

        // Windows: Use icacls to restrict directory permissions
        let output = std::process::Command::new("icacls")
            .args([
                ssh_dir_str.as_ref(),
                "/inheritance:r",
                "/grant:r",
                &format!("{}:F", current_user),
            ])
            .output()
            .map_err(|e| SshBuddyError::IoError {
                message: format!("Failed to run icacls: {}", e),
            })?;

        if output.status.success() {
            log::info!(
                "[permission_service] Windows: Fixed SSH directory permissions for {:?}",
                ssh_dir
            );
            Ok(PermissionFixResult {
                success: true,
                message: format!(
                    "SSH directory permissions restricted to current user ({}) only",
                    current_user
                ),
                new_mode: Some("User only".to_string()),
            })
        } else {
            let stderr = String::from_utf8_lossy(&output.stderr);
            log::warn!(
                "[permission_service] Windows: Failed to fix SSH directory permissions: {}",
                stderr
            );
            Ok(PermissionFixResult {
                success: false,
                message: format!("Failed to set directory permissions: {}", stderr),
                new_mode: None,
            })
        }
    }
}
