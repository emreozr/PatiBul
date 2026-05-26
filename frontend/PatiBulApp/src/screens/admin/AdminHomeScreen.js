import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../../context/AuthContext';
import config from '../../config';

const API_URL = config.API_URL;

const TABS = [
  { key: 'dashboard', label: '📊 Panel' },
  { key: 'pending', label: '⏳ Bekleyen' },
  { key: 'vets', label: '🏥 Veterinerler' },
  { key: 'users', label: '👥 Kullanıcılar' },
];

const typeConfig = {
  kayip: { label: 'Kayıp', color: '#FF6B6B' },
  bulunan: { label: 'Bulunan', color: '#4ECDC4' },
  yarali: { label: 'Yaralı', color: '#FFE66D' },
};

const StatCard = ({ label, value, sub, color, onPress }) => (
  <TouchableOpacity
    style={[styles.statCard, { borderTopColor: color }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.7 : 1}
  >
    <Text style={[styles.statValue, { color }]}>{value}</Text>
    <Text style={styles.statLabel}>{label}</Text>
    {sub && <Text style={styles.statSub}>{sub}</Text>}
    {onPress && <Text style={styles.statTap}>Görüntüle →</Text>}
  </TouchableOpacity>
);

const AdminHomeScreen = () => {
  const { token, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [pendingVets, setPendingVets] = useState([]);
  const [allVets, setAllVets] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal: kullanıcı/vet ilanları
  const [selectedUser, setSelectedUser] = useState(null);
  const [userReports, setUserReports] = useState([]);
  const [reportsModal, setReportsModal] = useState(false);
  const [reportsLoading, setReportsLoading] = useState(false);

  // Dashboard modal: tüm ilanlar
  const [dashboardModal, setDashboardModal] = useState(null); // 'users' | 'vets' | 'reports'
  const [dashboardReports, setDashboardReports] = useState([]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [statsRes, pendingRes, vetsRes, usersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/stats`, { headers }),
        fetch(`${API_URL}/api/admin/vets/pending`, { headers }),
        fetch(`${API_URL}/api/admin/vets`, { headers }),
        fetch(`${API_URL}/api/admin/users`, { headers }),
      ]);
      const [statsData, pendingData, vetsData, usersData] = await Promise.all([
        statsRes.json(), pendingRes.json(), vetsRes.json(), usersRes.json(),
      ]);
      if (statsRes.ok) setStats(statsData);
      if (pendingRes.ok) setPendingVets(pendingData.vets || []);
      if (vetsRes.ok) setAllVets(vetsData.vets || []);
      if (usersRes.ok) setAllUsers(usersData.users || []);
    } catch (e) {
      Alert.alert('Hata', 'Veriler yüklenemedi.');
    } finally {
      setLoading(false);
    }
  }, [token]);

  useFocusEffect(useCallback(() => { fetchData(); }, [fetchData]));

  // Kullanıcı/vet ilanlarını getir
  const fetchUserReports = async (user) => {
    setSelectedUser(user);
    setReportsModal(true);
    setReportsLoading(true);
    try {
      const res = await fetch(`${API_URL}/api/admin/users/${user.id}/reports`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (res.ok) setUserReports(data.reports || []);
    } catch (e) { Alert.alert('Hata', 'İlanlar yüklenemedi.'); }
    finally { setReportsLoading(false); }
  };

  // Dashboard'dan tüm ilanları getir
  const [dashboardModalTitle, setDashboardModalTitle] = useState('İlanlar');

  const fetchDashboardReports = async (type, title = 'İlanlar') => {
    if (type === 'users') { setActiveTab('users'); return; }
    if (type === 'vets') { setActiveTab('vets'); return; }
    if (type === 'pending') { setActiveTab('pending'); return; }

    setDashboardModalTitle(title);
    setDashboardModal('reports_loading');

    let url = `${API_URL}/api/admin/reports/recent`;
    if (type === 'kayip') url += '?type=kayip';
    else if (type === 'bulunan') url += '?type=bulunan';
    else if (type === 'yarali') url += '?type=yarali';
    else if (type === 'tamamlandi') url += '?status=tamamlandi';
    else if (type === 'active') url += '?status=active';
    // 'all' = filtre yok, tüm ilanlar

    try {
      const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
      const data = await res.json();
      if (res.ok) { setDashboardReports(data.reports || []); setDashboardModal('reports'); }
    } catch (e) { setDashboardModal(null); }
  };

  // İlan sil
  const deleteReport = (reportId, onSuccess) => {
    Alert.alert('İlanı Sil', 'Bu ilanı silmek istediğinize emin misiniz?', [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/admin/reports/${reportId}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { Alert.alert('Silindi'); onSuccess && onSuccess(); fetchData(); }
          } catch (e) { Alert.alert('Hata', 'Silinemedi.'); }
        }
      },
    ]);
  };

  // Kullanıcı sil
  const deleteUser = (user) => {
    Alert.alert('Kullanıcıyı Sil', `${user.name} adlı kullanıcıyı silmek istediğinize emin misiniz? Tüm ilanları da silinecek.`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Sil', style: 'destructive', onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/api/admin/users/${user.id}`, {
              method: 'DELETE',
              headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { Alert.alert('Silindi', `${user.name} silindi.`); fetchData(); }
          } catch (e) { Alert.alert('Hata', 'Silinemedi.'); }
        }
      },
    ]);
  };

  const handleApprove = (vet) => {
    Alert.alert('Onayla', `${vet.name} adlı veterineri onaylamak istiyor musunuz?`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Onayla', onPress: async () => {
          setActionLoading(vet.id);
          try {
            const res = await fetch(`${API_URL}/api/admin/vets/${vet.id}/approve`, {
              method: 'POST', headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) { Alert.alert('✅ Onaylandı', `${vet.name} onaylandı, mail gönderildi.`); fetchData(); }
          } catch (e) { Alert.alert('Hata', 'İşlem başarısız.'); }
          finally { setActionLoading(null); }
        }
      },
    ]);
  };

  const handleReject = (vet) => {
    Alert.prompt('Reddet', `${vet.name} için red sebebi:`, [
      { text: 'İptal', style: 'cancel' },
      {
        text: 'Reddet', style: 'destructive', onPress: async (reason) => {
          setActionLoading(vet.id);
          try {
            const res = await fetch(`${API_URL}/api/admin/vets/${vet.id}/reject`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
              body: JSON.stringify({ reason: reason || 'Belirtilmedi' }),
            });
            if (res.ok) { Alert.alert('❌ Reddedildi', `${vet.name} reddedildi.`); fetchData(); }
          } catch (e) { Alert.alert('Hata', 'İşlem başarısız.'); }
          finally { setActionLoading(null); }
        }
      },
    ], 'plain-text');
  };

  const renderAvatar = (item) => {
    if (item.profile_photo) {
      return (
        <Image
          source={{ uri: `${API_URL}/${item.profile_photo}` }}
          style={styles.userAvatarImg}
        />
      );
    }
    return (
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>{item.name?.[0]?.toUpperCase() || '?'}</Text>
      </View>
    );
  };

  const renderDashboard = () => (
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16 }}>
      {stats ? (
        <>
          <Text style={styles.sectionTitle}>👥 Kullanıcılar</Text>
          <View style={styles.statRow}>
            <StatCard
              label="Toplam Kullanıcı" value={stats.users.total}
              sub={`+${stats.users.this_week} bu hafta`} color="#007AFF"
              onPress={() => { setActiveTab('users'); }}
            />
            <StatCard
              label="Onaylı Veteriner" value={stats.vets.approved} color="#3DAA6E"
              onPress={() => { setActiveTab('vets'); }}
            />
          </View>
          <View style={styles.statRow}>
            <StatCard
              label="Bekleyen Veteriner" value={stats.vets.pending} color="#FF9500"
              onPress={() => fetchDashboardReports('pending')}
            />
            <StatCard label="Toplam Mesaj" value={stats.messages.total} color="#7B61FF" />
          </View>

          <Text style={styles.sectionTitle}>📋 İlanlar</Text>
          <View style={styles.statRow}>
            <StatCard
              label="Toplam İlan" value={stats.reports.total}
              sub={`+${stats.reports.this_week} bu hafta`} color="#1a1a2e"
              onPress={() => fetchDashboardReports('all', 'Tüm İlanlar')}
            />
            <StatCard
              label="Aktif İlan" value={stats.reports.active} color="#FF6B6B"
              onPress={() => fetchDashboardReports('active', 'Aktif İlanlar')}
            />
          </View>
          <View style={styles.statRow}>
            <StatCard label="Tamamlanan" value={stats.reports.completed} color="#3DAA6E" onPress={() => fetchDashboardReports('tamamlandi', 'Tamamlanan İlanlar')} />
            <StatCard label="Kayıp İlan" value={stats.reports.kayip} color="#FF3B30" onPress={() => fetchDashboardReports('kayip', 'Kayıp İlanlar')} />
          </View>
          <View style={styles.statRow}>
            <StatCard label="Bulunan İlan" value={stats.reports.bulunan} color="#4ECDC4" onPress={() => fetchDashboardReports('bulunan', 'Bulunan İlanlar')} />
            <StatCard label="Yaralı İlan" value={stats.reports.yarali} color="#FFE66D" onPress={() => fetchDashboardReports('yarali', 'Yaralı İlanlar')} />
          </View>
        </>
      ) : (
        <ActivityIndicator size="large" color="#3DAA6E" style={{ marginTop: 40 }} />
      )}
    </ScrollView>
  );

  const renderReportItem = (item, onDelete) => {
    const type = typeConfig[item.report_type] || typeConfig.kayip;
    const firstImage = item.images && item.images.length > 0 ? item.images[0] : null;
    return (
      <View key={item.id} style={styles.reportCard}>
        {firstImage && (
          <Image
            source={{ uri: `${API_URL}${firstImage.image_url}` }}
            style={styles.reportImage}
            resizeMode="cover"
          />
        )}
        <View style={styles.reportCardContent}>
          <View style={styles.reportHeader}>
            <View style={[styles.typeBadge, { backgroundColor: type.color + '22' }]}>
              <Text style={[styles.typeBadgeText, { color: type.color }]}>{type.label}</Text>
            </View>
            <TouchableOpacity style={styles.deleteReportBtn} onPress={() => deleteReport(item.id, onDelete)}>
              <Text style={styles.deleteReportBtnText}>🗑️ Sil</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.reportAnimal}>{item.animal_type}</Text>
          <Text style={styles.reportDesc} numberOfLines={2}>{item.description}</Text>
          {item.location_desc && <Text style={styles.reportLocation}>📍 {item.location_desc}</Text>}
          <View style={styles.reportFooter}>
            <Text style={styles.reportDate}>📅 {new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
            {item.user_name && <Text style={styles.reportUser}>👤 {item.user_name}</Text>}
          </View>
        </View>
      </View>
    );
  };

  const renderPendingVets = () => (
    <FlatList
      data={pendingVets}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={{ padding: 16 }}
      onRefresh={fetchData}
      refreshing={loading}
      ListEmptyComponent={
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>✅</Text>
          <Text style={styles.emptyText}>Onay bekleyen veteriner yok</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.vetCard}>
          <View style={styles.vetCardHeader}>
            {renderAvatar(item)}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={styles.pendingBadge}>
                <Text style={styles.pendingBadgeText}>⏳ Onay Bekliyor</Text>
              </View>
              <Text style={styles.vetName}>{item.name}</Text>
              <Text style={styles.vetEmail}>{item.email}</Text>
            </View>
          </View>
          {item.phone && <Text style={styles.vetDetail}>📞 {item.phone}</Text>}
          {item.clinic_name && <Text style={styles.vetDetail}>🏥 {item.clinic_name}</Text>}
          {item.clinic_address && <Text style={styles.vetDetail}>📍 {item.clinic_address}</Text>}
          <Text style={styles.vetDate}>
            📅 {new Date(item.created_at).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
          </Text>
          {actionLoading === item.id ? (
            <ActivityIndicator size="small" color="#3DAA6E" style={{ marginTop: 12 }} />
          ) : (
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.approveBtn} onPress={() => handleApprove(item)}>
                <Text style={styles.approveBtnText}>✅ Onayla</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.rejectBtn} onPress={() => handleReject(item)}>
                <Text style={styles.rejectBtnText}>❌ Reddet</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    />
  );

  const renderVets = () => (
    <FlatList
      data={allVets}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={{ padding: 16 }}
      onRefresh={fetchData}
      refreshing={loading}
      ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Veteriner yok</Text></View>}
      renderItem={({ item }) => (
        <TouchableOpacity style={styles.vetCard} onPress={() => fetchUserReports(item)}>
          <View style={styles.vetCardHeader}>
            {renderAvatar(item)}
            <View style={{ flex: 1, marginLeft: 12 }}>
              <View style={[styles.statusBadge, { backgroundColor: item.is_approved ? '#3DAA6E22' : '#FF950022' }]}>
                <Text style={[styles.statusBadgeText, { color: item.is_approved ? '#3DAA6E' : '#FF9500' }]}>
                  {item.is_approved ? '✅ Onaylı' : '⏳ Bekliyor'}
                </Text>
              </View>
              <Text style={styles.vetName}>{item.name}</Text>
              <Text style={styles.vetEmail}>{item.email}</Text>
            </View>
          </View>
          {item.clinic_name && <Text style={styles.vetDetail}>🏥 {item.clinic_name}</Text>}
          {item.clinic_address && <Text style={styles.vetDetail}>📍 {item.clinic_address}</Text>}
          {item.clinic_hours && <Text style={styles.vetDetail}>🕐 {item.clinic_hours}</Text>}
          <Text style={styles.vetDate}>📅 {new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.viewReportsBtn} onPress={() => fetchUserReports(item)}>
              <Text style={styles.viewReportsBtnText}>📋 İlanları Gör</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteUser(item)}>
              <Text style={styles.deleteBtnText}>🗑️ Sil</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      )}
    />
  );

  const renderUsers = () => (
    <FlatList
      data={allUsers}
      keyExtractor={item => item.id.toString()}
      contentContainerStyle={{ padding: 16 }}
      onRefresh={fetchData}
      refreshing={loading}
      ListEmptyComponent={<View style={styles.emptyContainer}><Text style={styles.emptyText}>Kullanıcı yok</Text></View>}
      renderItem={({ item }) => (
        <View style={styles.userCard}>
          {renderAvatar(item)}
          <View style={styles.userInfo}>
            <Text style={styles.vetName}>{item.name}</Text>
            <Text style={styles.vetEmail}>{item.email}</Text>
            {item.phone && <Text style={styles.vetDetail}>📞 {item.phone}</Text>}
            <View style={styles.userStats}>
              <Text style={styles.userStat}>📋 {item.report_count} ilan</Text>
              <Text style={styles.userStat}>✉️ {item.message_count} mesaj</Text>
            </View>
            <Text style={styles.vetDate}>📅 {new Date(item.created_at).toLocaleDateString('tr-TR')}</Text>
            <View style={styles.actionRow}>
              <TouchableOpacity style={styles.viewReportsBtn} onPress={() => fetchUserReports(item)}>
                <Text style={styles.viewReportsBtnText}>📋 İlanları Gör</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.deleteBtn} onPress={() => deleteUser(item)}>
                <Text style={styles.deleteBtnText}>🗑️ Sil</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>🛡️ Admin Paneli</Text>
          <Text style={styles.headerSub}>PatiBul Yönetim</Text>
        </View>
        <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
          <Text style={styles.logoutBtnText}>Çıkış</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsRow}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}{tab.key === 'pending' && pendingVets.length > 0 ? ` (${pendingVets.length})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.content}>
        {loading && !stats ? (
          <ActivityIndicator size="large" color="#3DAA6E" style={{ marginTop: 40 }} />
        ) : (
          <>
            {activeTab === 'dashboard' && renderDashboard()}
            {activeTab === 'pending' && renderPendingVets()}
            {activeTab === 'vets' && renderVets()}
            {activeTab === 'users' && renderUsers()}
          </>
        )}
      </View>

      {/* Kullanıcı İlanları Modal */}
      <Modal visible={reportsModal} animationType="slide" onRequestClose={() => setReportsModal(false)}>
        <View style={styles.modalContainer}>
          <SafeAreaView edges={['top']} style={{ backgroundColor: '#1a1a2e' }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedUser?.name} - İlanlar</Text>
              <TouchableOpacity onPress={() => setReportsModal(false)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          {reportsLoading ? (
            <ActivityIndicator size="large" color="#3DAA6E" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={userReports}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ padding: 16 }}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>Bu kullanıcının ilanı yok</Text>
                </View>
              }
              renderItem={({ item }) => renderReportItem(item, () => {
                setUserReports(prev => prev.filter(r => r.id !== item.id));
              })}
            />
          )}
        </View>
      </Modal>

      {/* Dashboard İlanlar Modal */}
      <Modal visible={dashboardModal === 'reports' || dashboardModal === 'reports_loading'} animationType="slide" onRequestClose={() => setDashboardModal(null)}>
        <View style={styles.modalContainer}>
          <SafeAreaView edges={['top']} style={{ backgroundColor: '#1a1a2e' }}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{dashboardModalTitle}</Text>
              <TouchableOpacity onPress={() => setDashboardModal(null)}>
                <Text style={styles.modalClose}>✕</Text>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
          {dashboardModal === 'reports_loading' ? (
            <ActivityIndicator size="large" color="#3DAA6E" style={{ marginTop: 40 }} />
          ) : (
            <FlatList
              data={dashboardReports}
              keyExtractor={item => item.id.toString()}
              contentContainerStyle={{ padding: 16 }}
              renderItem={({ item }) => renderReportItem(item, () => {
                setDashboardReports(prev => prev.filter(r => r.id !== item.id));
              })}
            />
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.6)',
  },
  logoutBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  logoutBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
  },
  tabsRow: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexGrow: 0,
  },
  tab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  tabActive: {
    backgroundColor: '#3DAA6E',
  },
  tabText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '500',
  },
  tabTextActive: {
    color: '#fff',
    fontWeight: '700',
  },
  content: {
    flex: 1,
    backgroundColor: '#F5F7FA',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a2e',
    marginBottom: 12,
    marginTop: 8,
  },
  statRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    borderTopWidth: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  statValue: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
  statSub: {
    fontSize: 11,
    color: '#3DAA6E',
    marginTop: 4,
  },
  statTap: {
    fontSize: 11,
    color: '#007AFF',
    marginTop: 6,
    fontWeight: '600',
  },
  vetCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  vetCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1a1a2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarImg: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  userAvatarText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  pendingBadge: {
    backgroundColor: '#FF950022',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  pendingBadgeText: {
    fontSize: 12,
    color: '#FF9500',
    fontWeight: '700',
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  vetName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 2,
  },
  vetEmail: {
    fontSize: 13,
    color: '#3DAA6E',
    marginBottom: 4,
  },
  vetDetail: {
    fontSize: 13,
    color: '#666',
    marginBottom: 3,
  },
  vetDate: {
    fontSize: 12,
    color: '#aaa',
    marginTop: 6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#3DAA6E',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  approveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
  },
  rejectBtnText: {
    color: '#FF3B30',
    fontWeight: '700',
    fontSize: 14,
  },
  viewReportsBtn: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  viewReportsBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 13,
  },
  deleteBtn: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FF3B30',
  },
  deleteBtnText: {
    color: '#FF3B30',
    fontWeight: '600',
    fontSize: 13,
  },
  userCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  userInfo: {
    flex: 1,
  },
  userStats: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 6,
    marginBottom: 2,
  },
  userStat: {
    fontSize: 12,
    color: '#3DAA6E',
    fontWeight: '600',
  },
  reportCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    overflow: 'hidden',
  },
  reportImage: {
    width: '100%',
    height: 160,
  },
  reportCardContent: {
    padding: 14,
  },
  reportFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  reportLocation: {
    fontSize: 12,
    color: '#888',
    marginBottom: 4,
  },
  reportUser: {
    fontSize: 12,
    color: '#3DAA6E',
    fontWeight: '500',
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  typeBadge: {
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  deleteReportBtn: {
    backgroundColor: '#FF3B3011',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#FF3B30',
  },
  deleteReportBtnText: {
    fontSize: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  reportAnimal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  reportDesc: {
    fontSize: 13,
    color: '#555',
    marginBottom: 6,
  },
  reportDate: {
    fontSize: 12,
    color: '#aaa',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingTop: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  emptyText: {
    fontSize: 15,
    color: '#aaa',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#1a1a2e',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  modalClose: {
    fontSize: 20,
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default AdminHomeScreen;