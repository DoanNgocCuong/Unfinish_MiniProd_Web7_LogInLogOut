const Home = ({ message, t, users, departments }) => {

    return (
        <main className="main-content">
            <p>{message}</p>

            {/* Hero section */}
            <section className="hero-section">
                <h1 className="highlight-title">{t('welcome.title')}</h1>
                <p className="hero-description">
                    {t('welcome.description')}
                </p>
            </section>

            {/* Key benefits section */}
            <section className="departments-section">
                <h2 className="highlight-title">{t('departments.title')}</h2>
                <div className="departments-grid">
                    {Object.entries(departments).map(([key, dept]) => (
                        <div key={key} className="department-card">
                            <h3>{dept.name}</h3>
                            <div className="tools-list">
                                {dept.tools.map((tool, index) => (
                                    <div key={index} className="tool-item">
                                        <span className="tool-icon">🔧</span>
                                        <span className="tool-name">{tool}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </section>


            <div className="users-section">
                <h2 className="highlight-title">{t('team.title', 'Team Members')}</h2>
                <div className="users-grid">
                    {users && users.length > 0 ? (
                        users.map(user => (
                            <div key={user.id} className="user-card">
                                <div className="user-avatar">{user.name[0]}</div>
                                <h3>{user.name}</h3>
                                <p className="user-email">{user.email}</p>
                                <span className="user-role">{user.role}</span>
                            </div>
                        ))
                    ) : (
                        <p>Loading users...</p>
                    )}
                </div>
            </div>

            {/* Quick access section */}
            <section className="quick-access">
                <h2 className="highlight-title">{t('quickAccess.title', 'Quick Links')}</h2>
                <div className="quick-links">
                    <a href="/handbook" className="quick-link">
                        <span className="icon">📚</span>
                        {t('quickAccess.handbook', 'Company Handbook')}
                    </a>
                    <a href="/support" className="quick-link">
                        <span className="icon">💡</span>
                        {t('quickAccess.support', 'IT Support')}
                    </a>
                    <a href="/training" className="quick-link">
                        <span className="icon">🎓</span>
                        {t('quickAccess.training', 'Training Portal')}
                    </a>
                </div>
            </section>
        </main>
    )
}

export default Home;